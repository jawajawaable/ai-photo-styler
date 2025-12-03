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
                const imageResponse = await fetch(job.input_image_url);
                const imageBuffer = await imageResponse.arrayBuffer();
                const imageBase64 = Buffer.from(imageBuffer).toString('base64');

                let image2Base64 = null;
                if (job.input_image2_url) {
                    const image2Response = await fetch(job.input_image2_url);
                    const image2Buffer = await image2Response.arrayBuffer();
                    image2Base64 = Buffer.from(image2Buffer).toString('base64');
                }

                // Generate with Gemini
                const model = genAI.getGenerativeModel({ model: MODEL_NAME });

                const imageParts = [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: imageBase64,
                        },
                    },
                ];

                if (image2Base64) {
                    imageParts.push({
                        inlineData: {
                            mimeType: 'image/jpeg',
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
        console.log('[Job Processor] Checking for pending jobs...');
        const response = await fetch('http://localhost:3000/api/process-jobs', {
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
