// Backend API URL
const API_URL = 'https://ai-photo-styler-1-hozn.onrender.com';

export const generateStyledImage = async (base64Image, styleDescription, userId, image2Base64 = null) => {
    try {
        console.log('Backend API çağrılıyor:', `${API_URL}/api/generate-style`);

        const body = {
            image: base64Image,
            prompt: styleDescription,
            userId: userId,
        };

        if (image2Base64) {
            body.image2 = image2Base64;
        }

        const response = await fetch(`${API_URL}/api/generate-style`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || 'Bir hata oluştu');
            } catch (e) {
                if (response.status === 403) {
                    throw new Error('Yetersiz kredi! Lütfen kredi yükleyin.');
                }
                throw new Error('Sunucu hatası. Lütfen tekrar deneyin.');
            }
        }

        const resultText = await response.text();
        try {
            const result = JSON.parse(resultText);
            return result;
        } catch (e) {
            console.error('JSON Parse Error. Raw response:', resultText);
            throw new Error('Sunucudan geçersiz yanıt alındı.');
        }

    } catch (error) {
        console.error('Service Error:', error);
        throw error;
    }
};
