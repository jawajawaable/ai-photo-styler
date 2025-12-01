require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for base64 images

// Gemini Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = 'gemini-2.5-flash-image';

// Health Check Route for Render
app.get('/', (req, res) => {
    res.send('AI Photo Styler Backend Running');
});

const supabase = require('./supabaseClient');

app.post('/api/generate-style', async (req, res) => {
    try {
        const { image, prompt, userId } = req.body;

        if (!image || !prompt || !userId) {
            return res.status(400).json({ error: 'Image, prompt, and userId are required' });
        }

        // 0. Check Credits
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('Profile Fetch Error:', profileError);
            return res.status(500).json({ error: 'Kullanıcı profili alınamadı.' });
        }

        if (profile.credits < 1) {
            return res.status(403).json({ error: 'Yetersiz kredi! Lütfen kredi yükleyin.' });
        }

        console.log(`Processing style generation request for user ${userId} (Credits: ${profile.credits})...`);

        // Clean base64 string
        const cleanBase64 = image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

        // Generate a unique ID for this transaction
        const timestamp = Date.now();
        const id = `${timestamp}-${Math.random().toString(36).substring(7)}`;

        // 1. Upload Input Image to Supabase (Optional, for history)
        const inputBuffer = Buffer.from(cleanBase64, 'base64');
        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(`inputs/${id}.jpg`, inputBuffer, { contentType: 'image/jpeg' });

        if (uploadError) console.warn('Input image upload failed:', uploadError.message);

        // 2. Call Gemini API
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const fullPrompt = `You are an expert artistic style transfer AI. 
    
    TASK:
    Transform the INPUT IMAGE to match the visual style described below.
    
    TARGET STYLE DESCRIPTION:
    "${prompt}"

    INSTRUCTIONS:
    1. Analyze the style description.
    2. Apply these stylistic elements to the INPUT IMAGE.
    3. CRITICAL: Maintain the identity, gender, pose, and main facial features of the subject from the INPUT IMAGE.
    4. Output a high-quality, cohesive image.`;

        const imagePart = {
            inlineData: {
                data: cleanBase64,
                mimeType: "image/jpeg",
            },
        };

        const result = await model.generateContent([fullPrompt, imagePart]);
        const response = await result.response;

        console.log('Gemini API Response received');

        const parts = response.candidates?.[0]?.content?.parts;

        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    const outputBase64 = part.inlineData.data;
                    const outputBuffer = Buffer.from(outputBase64, 'base64');

                    // 3. Upload Output Image to Supabase
                    const { data: uploadData, error: outputUploadError } = await supabase.storage
                        .from('images')
                        .upload(`outputs/${id}.png`, outputBuffer, { contentType: 'image/png' });

                    if (outputUploadError) {
                        console.error('Output upload failed:', outputUploadError);
                        // Fallback to sending base64 if upload fails
                        return res.json({
                            type: 'image',
                            data: outputBase64,
                            description: 'Görsel oluşturuldu (Depolama hatası nedeniyle yerel kopya).'
                        });
                    }

                    // 4. Get Public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('images')
                        .getPublicUrl(`outputs/${id}.png`);

                    // 5. Deduct Credit
                    const { error: deductError } = await supabase
                        .from('profiles')
                        .update({ credits: profile.credits - 1 })
                        .eq('id', userId);

                    if (deductError) {
                        console.error('Credit deduction failed:', deductError);
                        return res.json({
                            type: 'image',
                            url: publicUrl,
                            data: outputBase64,
                            description: 'Görsel oluşturuldu ancak kredi düşülemedi. (Hata: ' + deductError.message + ')'
                        });
                    }

                    return res.json({
                        type: 'image',
                        url: publicUrl,
                        data: outputBase64,
                        description: 'Görsel başarıyla oluşturuldu. Kalan Kredi: ' + (profile.credits - 1)
                    });
                }
            }
        }

        const text = response.text();
        if (text) {
            console.warn('Model returned text instead of image:', text);
            return res.status(500).json({ error: 'Model metin döndürdü, görsel oluşturulamadı.', details: text });
        }

        res.status(500).json({ error: 'API geçerli bir görsel döndürmedi.' });

    } catch (error) {
        console.error('Backend Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});
