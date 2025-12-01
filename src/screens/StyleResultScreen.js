import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert, Linking, TouchableOpacity } from 'react-native';
import { Button, Text, ActivityIndicator, IconButton, Surface, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateStyledImage } from '../services/geminiService';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';

const STYLES = [
    {
        id: 'vesikalik',
        name: 'Vesikalık',
        description: 'Resmi belgeler için klasik mavi arka planlı vesikalık fotoğraf tarzı.',
        promptModifier: 'A centered portrait of a man against a solid blue background with a gentle gradient (slightly darker at the bottom, lighter at the top).   expression is neutral and formal, looking directly at the camera. The lighting is bright, soft, and evenly distributed, similar to a Turkish ID/passport photo. Shoulders visible, head fully centered, no dramatic shadows, no artistic effects. Simple, clean, official studio portrait style.',
        icon: '👔',
        color: '#1d4ed8'
    },
    {
        id: 'bulut',
        name: 'Bulut',
        description: 'Mavi gökyüzü ve beyaz bulutlar önünde neşeli bir kolaj.',
        promptModifier: 'A collage features six different images of the same person with a fair skin tone and dark hair, set against a backdrop of a bright blue sky with scattered white clouds.  with a prominent smile in most of the shots. H \n\nIn the largest and most prominent image, located in the bottom right, the person is shown in a close-up from the chest up, laughing heartily, with his mouth open and teeth visible. His expression is one of genuine amusement.\n\nThree smaller, full-body images are positioned across the bottom of the collage, showing the person seated outdoors on what appears to be a bench or ledge.  \n\nIn the bottom left image, person is sitting upright, smiling broadly with his hands resting in his lap.\n\nIn the center bottom image, person is doubled over in laughter, covering its face with both hands, suggesting a moment of intense, possibly overwhelming, humor.\n\nIn the bottom right of the seated trio,  person is again smiling, slightly more reserved than the large close-up, with a similar posture to the bottom left image.\n\nTwo further, medium-sized, smiling headshots/bust shots are positioned in the top left and top right, slightly faded or set back compared to the others, adding depth to the collage. The top right image is angled slightly differently,  \n\nThe setting suggested by the seated images—a bright, open area—is entirely replaced by the highly visible, slightly artificial-looking cloudscape, creating a surreal or dreamlike composition. The focus is entirely on the person\'s emotional reactions, particularly laughter.',
        icon: '☁️',
        color: '#0ea5e9'
    },
    {
        id: 'gryffindor',
        name: 'Gryffindor',
        description: 'Kırmızı ve altın renkli sancaklarla büyüleyici Hogwarts atmosferi.',
        promptModifier: `A full-body, indoor photo of a young adult male with fair skin and dark brown hair, standing centered in front of a red and gold banner. He appears to be in his late 20s or early 30s, with a short, trimmed beard of the same dark brown color as his hair. His hair is styled neatly, slightly parted on the side. He is wearing a white athletic jacket with a black zipper down the front and a black Nike swoosh logo on the left chest. The jacket has black piping along the zipper and collar. Underneath the jacket, he is wearing a dark garment visible at the neck. He is also wearing black athletic pants and white sneakers. His posture is upright, with his hands clasped together in front of him at waist level, possibly holding a small item or just resting them. He is looking directly at the camera with a slight, friendly smile.

The background consists of a large banner primarily in red and gold, featuring a crest with a lion and possibly other mythical creatures. The word "GRYFFINDOR" is visible in an arc above the crest, suggesting the banner is related to the Harry Potter series. To the right of the Gryffindor banner, a partial view of another flag or banner, possibly Turkish based on the red color and visible star and crescent outline, is seen. The wall behind the subject and the ground beneath him are a light gray or white color, possibly concrete, and the lighting is even but slightly washed out, giving the photo a somewhat vintage or low-quality appearance.`,
        icon: '🏰',
        color: '#b91c1c'
    },
    {
        id: 'osmanli',
        name: 'Osmanlı',
        description: 'Geleneksel Osmanlı minyatür sanatı, düz perspektif ve zengin motifler.',
        promptModifier: '2D Ottoman miniature illustration style. Highly detailed and ornate with vibrant and symbolic color use. Follows flat perspective with no realistic shadows. Richly patterned ornamental borders. Includes swirling decorative motifs such as stylized smoke clouds and floral arabesques. The aesthetic merges classical Ottoman manuscript art with contemporary visual cues in a harmonious and elegant composition. Figures are drawn in graceful, symbolic poses. Visual storytelling is emphasized through pattern, symmetry, and cultural iconography. All elements reflect the traditional aesthetic logic of miniature painting, adapted for modern symbolic expression.',
        icon: '🕌',
        color: '#b45309'
    },
    {
        id: 'asker',
        name: 'Asker',
        description: "90'lar Türk askeri fotoğraf stüdyosu estetiği, kamuflaj, mavi bere ve dramatik bayrak arka planı.",
        promptModifier: 'A surreal and kitschy digital collage inspired by 90s Turkish military photo studio posters. A man is posing like a conscripted commando, holding a rifle, wearing camouflage pants and a blue beret with a Turkish crescent-star insignia. The background includes a red sky, dramatic Turkish flag overlays, ghostly glowing man eyes in the sky, and over-saturated color grading. a copy of man stand around in macho poses, and some ticks are crawling near their feet. The tone is absurd, emotional, nostalgic, and heroic.',
        icon: '🪖',
        color: '#065f46'
    },
    {
        id: 'devrimci',
        name: 'Devrimci',
        description: 'İkonik, siyah-beyaz ve karizmatik devrimci poster estetiği.',
        promptModifier: 'A powerful and iconic revolutionary portrait shot with a 40–50 mm lens. The subject looks slightly up at the camera, chin slightly raised, with a determined and stern expression looking towards distant horizons. Half portrait framed at shoulder level. Wearing a dark, military-style collared jacket. Long, wavy hair moving very slightly with the wind. Wearing a simple beret with a round rim and a small, single metal star detail on the beret. Background is neutral and slightly grainy; dramatic, low contrast, black and white film look. Slight beard shadow on the face, iconographic poster aesthetic, strong shadow distribution, revolutionary and charismatic aura.',
        icon: '⭐',
        color: '#44403c'
    },
    {
        id: 'anime',
        name: 'Anime',
        description: 'Canlı renkler ve keskin hatlarla Japon animasyon stili.',
        promptModifier: 'anime style, cel shaded, vibrant, japanese animation, studio ghibli inspired, detailed line work',
        icon: '✨',
        color: '#3b82f6'
    },
    {
        id: 'arabesk',
        name: 'Arabesk',
        description: '90\'lar arabesk albüm kapağı estetiği, dramatik ve nostaljik.',
        promptModifier: 'A hyper-kitsch 90’s Turkish arabesk album cover, extremely dramatic and over-the-top. yüzünde hüzünlü bir ifade ağlamaklı. sağa doğru uzaklara bakıyor. kaşlar kalkık. A foreign popstar styled like a Turkish arabesk singer from the VHS era, posing with dead-serious expression against an artificially vibrant, airbrushed gradient background (neon blue to purple). Giant yellow block letters with thick red outline for the album title at the bottom. Upper left corner features a retro, fake music label logo inspired by old ... The singer wears an exaggerated glittery pinstripe suit, shiny shoulder pads, wide collar shirt, oversized patterned tie, plastic-looking fake red carnation on the lapel. Skin retouched to unrealistic smoothness, ultra-saturated colors, heavy sparkle effects on the suit, soft fog glow around the body. Slight halftone texture like a scanned poster. tespih tutuyor. Overall tone: nostalgic, camp, melodramatic, intentionally low-budget graphic design. Add cheesy sparkle stars around the jacket, subtle VHS noise, faint lens blur, and artificial studio lighting reminiscent of 1989–1998 arabesk album photo sessions. Horizontal format.',
        icon: '🎤',
        color: '#7e22ce'
    },
    {
        id: 'tattoo',
        name: 'Dövme',
        description: 'Gerçekçi kol dövmesi simülasyonu.',
        promptModifier: 'Generate a photorealistic image of a man with his upper arm clearly visible in the frame. The man must be present and recognizable in the shot, not cropped out or only partially shown — the upper body and arm should be in full view. Create a realistic tattoo on his arm composed of thin, vein-like branching lines, as if inked naturally into the skin. Integrate a short Turkish exstra dramatic and silly quote into the tattoo design, making the text look naturally tattooed — no glow, no fantasy effects, no surreal colors, no exaggerated lighting. The result must look like a real-life photograph of a person with a healed, sharp and believable tattoo on his arm',
        icon: '💪',
        color: '#57534e'
    }
];

export default function StyleResultScreen({ imageUri, imageBase64, onBack }) {
    const [selectedStyle, setSelectedStyle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resultImage, setResultImage] = useState(null);
    const theme = useTheme();

    const handleSave = async () => {
        if (!resultImage) return;

        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'İzin Gerekli',
                    'Fotoğrafı kaydetmek için galeriye erişim izni vermelisiniz.',
                    [
                        { text: 'İptal', style: 'cancel' },
                        { text: 'Ayarları Aç', onPress: () => Linking.openSettings() }
                    ]
                );
                return;
            }

            const base64Code = resultImage.replace(/^data:image\/\w+;base64,/, "");
            const filename = FileSystem.documentDirectory + "styled_photo.png";

            await FileSystem.writeAsStringAsync(filename, base64Code, {
                encoding: 'base64',
            });

            await MediaLibrary.saveToLibraryAsync(filename);
            Alert.alert('Başarılı', 'Fotoğraf galeriye kaydedildi!');

        } catch (error) {
            console.error("Save Error:", error);
            Alert.alert('Hata', 'Kaydetme başarısız: ' + error.message);
        }
    };

    const handleApplyStyle = async () => {
        if (!selectedStyle) return;
        if (!imageBase64) {
            Alert.alert('Hata', 'Görsel verisi yüklenemedi. Lütfen tekrar fotoğraf seçin.');
            return;
        }

        setLoading(true);
        try {
            const result = await generateStyledImage(imageBase64, selectedStyle.promptModifier);

            if (result.type === 'image') {
                const newImageUri = `data:image/png;base64,${result.data}`;
                setResultImage(newImageUri);
            } else {
                Alert.alert('Uyarı', 'Beklenmeyen yanıt formatı.');
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Hata', 'İşlem başarısız: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerRow}>
                <IconButton icon="arrow-left" mode="contained-tonal" onPress={onBack} size={24} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Stüdyo</Text>
                {resultImage ? (
                    <IconButton
                        icon="download"
                        mode="contained"
                        containerColor={theme.colors.primary}
                        iconColor="white"
                        size={24}
                        onPress={handleSave}
                    />
                ) : <View style={{ width: 48 }} />}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Surface style={styles.imageContainer} elevation={4}>
                    <Image source={{ uri: resultImage || imageUri }} style={styles.image} />
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
                            <Text style={styles.loadingText}>Sanat eseri hazırlanıyor...</Text>
                        </View>
                    )}
                </Surface>

                <View style={styles.styleSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Bir Stil Seçin</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.styleList}>
                        {STYLES.map((style) => {
                            const isSelected = selectedStyle?.id === style.id;
                            return (
                                <TouchableOpacity
                                    key={style.id}
                                    onPress={() => setSelectedStyle(style)}
                                    activeOpacity={0.8}
                                >
                                    <Surface
                                        style={[
                                            styles.styleCard,
                                            isSelected && { borderColor: theme.colors.primary, borderWidth: 2, backgroundColor: theme.colors.primaryContainer }
                                        ]}
                                        elevation={isSelected ? 4 : 1}
                                    >
                                        <Text style={{ fontSize: 32 }}>{style.icon}</Text>
                                        <Text variant="labelMedium" style={[styles.styleName, isSelected && { color: theme.colors.primary, fontWeight: 'bold' }]}>
                                            {style.name}
                                        </Text>
                                    </Surface>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    mode="contained"
                    onPress={handleApplyStyle}
                    disabled={!selectedStyle || loading}
                    style={styles.applyButton}
                    contentStyle={{ height: 56 }}
                    labelStyle={{ fontSize: 18 }}
                >
                    {loading ? 'Uygulanıyor...' : 'Stili Uygula'}
                </Button>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    imageContainer: {
        margin: 16,
        height: 400,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    loadingText: {
        marginTop: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    styleSection: {
        marginTop: 10,
    },
    sectionTitle: {
        marginLeft: 20,
        marginBottom: 12,
        fontWeight: 'bold',
    },
    styleList: {
        paddingHorizontal: 16,
        gap: 12,
        paddingBottom: 20,
    },
    styleCard: {
        width: 100,
        height: 100,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
    },
    styleName: {
        marginTop: 8,
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    applyButton: {
        borderRadius: 28,
    },
});
