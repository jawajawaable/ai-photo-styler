// Backend API URL
// For Android Emulator: http://10.0.2.2:3000
// For iOS Simulator: http://localhost:3000
// For Physical Device: Use your computer's local IP (e.g., http://192.168.1.x:3000) or ngrok URL
const API_URL = 'https://ai-photo-styler-1-hozn.onrender.com/api/generate-style';

export const generateStyledImage = async (base64Image, styleDescription, userId) => {
    try {
        console.log('Backend API çağrılıyor:', API_URL);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
            },
            body: JSON.stringify({
                image: base64Image,
                prompt: styleDescription,
                userId: userId,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server Error Text:', errorText); // Log the raw HTML/text
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || 'Sunucu hatası');
            } catch (e) {
                throw new Error(`Sunucu Hatası (${response.status}): ${errorText.substring(0, 100)}...`);
            }
        }

        const resultText = await response.text();
        try {
            const result = JSON.parse(resultText);
            return result;
        } catch (e) {
            console.error('JSON Parse Error. Raw response:', resultText);
            throw new Error('Sunucudan geçersiz yanıt alındı (HTML olabilir).');
        }

    } catch (error) {
        console.error('Service Error:', error);
        throw new Error(`Servis Hatası: ${error.message}`);
    }
};
