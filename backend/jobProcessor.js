module.exports = function (app, supabase, genAI, MODEL_NAME) {
    // Job processor endpoint
    app.post('/api/process-jobs', async (req, res) => {
        try {
            console.log('Processing pending jobs...');

            // Get all pending jobs
            const { data: pendingJobs, error: fetchError } = await supabase
                .from('jobs')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: true })
                .limit(5); // Process max 5 at a time

            if (fetchError) throw fetchError;

            if (!pendingJobs || pendingJobs.length === 0) {
                return res.json({ message: 'No pending jobs', processed: 0 });
            }

            console.log(`Found ${pendingJobs.length} pending jobs`);
            const results = [];

            for (const job of pendingJobs) {
                try {
                    // Update status to processing
                    await supabase
                        .from('jobs')
                        .update({ status: 'processing' })
                        .eq('id', job.id);

                    console.log(`Processing job ${job.id} for style ${job.style_name}...`);

                    // Check credits
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('credits')
                        .eq('id', job.user_id)
                        .single();

                    if (profileError || profile.credits < 1) {
                        throw new Error('Yetersiz kredi');
                    }

                    // Download input images from URL
                    console.log(`Downloading input image from: ${job.input_image_url}`);
                    const imageResponse = await fetch(job.input_image_url);

                    if (!imageResponse.ok) {
                        throw new Error(`Failed to download input image: ${imageResponse.status} ${imageResponse.statusText}`);
                    }

                    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
                    console.log(`Input image content type: ${contentType}`);

                    if (!contentType || !contentType.startsWith('image/')) {
                        const errorBody = await imageResponse.text();
                        throw new Error(`Invalid image content type: ${contentType}. Response body: ${errorBody.substring(0, 200)}`);
                    }

                    const imageBuffer = await imageResponse.arrayBuffer();
                    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

                    let image2Base64 = null;
                    let image2ContentType = 'image/jpeg';

                    if (job.input_image2_url) {
                        console.log(`Downloading input image 2 from: ${job.input_image2_url}`);
                        const image2Response = await fetch(job.input_image2_url);

                        if (!image2Response.ok) {
                            throw new Error(`Failed to download input image 2: ${image2Response.status} ${image2Response.statusText}`);
                        }

                        image2ContentType = image2Response.headers.get('content-type');
                        console.log(`Input image 2 content type: ${image2ContentType}`);

                        if (!image2ContentType || !image2ContentType.startsWith('image/')) {
                            const errorBody = await image2Response.text();
                            throw new Error(`Invalid input image 2 content type: ${image2ContentType}. Response body: ${errorBody.substring(0, 200)}`);
                        }

                        const image2Buffer = await image2Response.arrayBuffer();
                        image2Base64 = Buffer.from(image2Buffer).toString('base64');
                    }

                    // Generate with Gemini
                    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

                    const imageParts = [
                        {
                            inlineData: {
                                mimeType: contentType,
                                data: imageBase64,
                            },
                        },
                    ];

                    if (image2Base64) {
                        imageParts.push({
                            inlineData: {
                                mimeType: image2ContentType,
                                data: image2Base64,
                            },
                        });
                    }

                    const result = await model.generateContent([
                        job.prompt,
                        ...imageParts,
                    ]);

                    const response = await result.response;
                    const candidates = response.candidates || [];

                    if (candidates.length === 0 || !candidates[0].content || !candidates[0].content.parts) {
                        throw new Error('No valid response from Gemini API');
                    }

                    let generatedImageData = null;
                    for (const part of candidates[0].content.parts) {
                        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                            generatedImageData = part.inlineData.data;
                            break;
                        }
                    }

                    if (!generatedImageData) {
                        throw new Error('No image in response');
                    }

                    // Upload result to Supabase Storage
                    const resultPath = `results/${job.user_id}/${job.id}.jpg`;
                    const resultBuffer = Buffer.from(generatedImageData, 'base64');

                    const { error: uploadError } = await supabase.storage
                        .from('style-images')
                        .upload(resultPath, resultBuffer, {
                            contentType: 'image/jpeg',
                            upsert: true,
                        });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('style-images')
                        .getPublicUrl(resultPath);

                    // Deduct credit
                    await supabase
                        .from('profiles')
                        .update({ credits: profile.credits - 1 })
                        .eq('id', job.user_id);

                    // Update job as completed
                    await supabase
                        .from('jobs')
                        .update({
                            status: 'completed',
                            result_image_url: publicUrl,
                            completed_at: new Date().toISOString(),
                        })
                        .eq('id', job.id);

                    results.push({ id: job.id, status: 'success' });
                    console.log(`✅ Job ${job.id} completed successfully`);

                } catch (jobError) {
                    console.error(`❌ Job ${job.id} failed:`, jobError);

                    // Mark as failed
                    await supabase
                        .from('jobs')
                        .update({
                            status: 'failed',
                            error_message: jobError.message,
                        })
                        .eq('id', job.id);

                    results.push({ id: job.id, status: 'failed', error: jobError.message });
                }
            }

            res.json({
                message: 'Jobs processed',
                processed: results.length,
                results,
            });

        } catch (error) {
            console.error('Job processing error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Auto-process jobs every 30 seconds
    setInterval(async () => {
        try {
            // Use local URL for self-call, assuming localhost is available in the container
            // In production (Render), we might need the full URL or just call the logic directly.
            // Calling logic directly is safer than HTTP request to self.
            // But for now, let's keep the HTTP call pattern but use a relative path if possible? No, fetch needs absolute.
            // Let's use the PORT env var.
            const port = process.env.PORT || 3000;
            const baseUrl = `http://localhost:${port}`;

            console.log('[Job Processor] Checking for pending jobs...');
            const response = await fetch(`${baseUrl}/api/process-jobs`, {
                method: 'POST',
            });
            const data = await response.json();
            if (data.processed > 0) {
                console.log(`[Job Processor] Processed ${data.processed} jobs`);
            }
        } catch (error) {
            console.error('[Job Processor] Error:', error.message);
        }
    }, 30000); // Every 30 seconds
};
