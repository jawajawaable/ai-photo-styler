import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { Text, ActivityIndicator, IconButton, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateStyledImage } from '../services/geminiService';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

const API_URL = 'https://ai-photo-styler-1-hozn.onrender.com';
const { width, height } = Dimensions.get('window');

const STYLES = [
    { id: 'vesikalik', name: 'Vesikalık', description: 'Resmi belgeler için klasik mavi arka planlı vesikalık fotoğraf tarzı.', promptModifier: 'A centered portrait of a man against a solid blue background with a gentle gradient (slightly darker at the bottom, lighter at the top). Expression is neutral and formal, looking directly at the camera. The lighting is bright, soft, and evenly distributed, similar to a Turkish ID/passport photo. Shoulders visible, head fully centered, no dramatic shadows, no artistic effects. Simple, clean, official studio portrait style.', icon: '👔', color: '#1d4ed8' },
    { id: 'bulut', name: 'Bulut', description: 'Mavi gökyüzü ve beyaz bulutlar önünde neşeli bir kolaj.', promptModifier: 'A collage features six different images of the same person with a fair skin tone and dark hair, set against a backdrop of a bright blue sky with scattered white clouds. With a prominent smile in most of the shots.', icon: '☁️', color: '#0ea5e9' },
    { id: 'gryffindor', name: 'Gryffindor', description: 'Kırmızı ve altın renkli sancaklarla büyüleyici Hogwarts atmosferi.', promptModifier: 'A full-body, indoor photo of a young adult male with fair skin and dark brown hair, standing centered in front of a red and gold banner.', icon: '🏰', color: '#b91c1c' },
    { id: 'osmanli', name: 'Osmanlı', description: 'Geleneksel Osmanlı minyatür sanatı, düz perspektif ve zengin motifler.', promptModifier: '2D Ottoman miniature illustration style. Highly detailed and ornate with vibrant and symbolic color use.', icon: '🕌', color: '#b45309' },
    { id: 'asker', name: 'Asker', description: "90'lar Türk askeri fotoğraf stüdyosu estetiği.", promptModifier: 'A surreal and kitschy digital collage inspired by 90s Turkish military photo studio posters.', icon: '🪖', color: '#065f46' },
    { id: 'devrimci', name: 'Devrimci', description: 'İkonik, siyah-beyaz ve karizmatik devrimci poster estetiği.', promptModifier: 'A powerful and iconic revolutionary portrait shot with a 40–50 mm lens.', icon: '⭐', color: '#44403c' },
    { id: 'anime', name: 'Anime', description: 'Canlı renkler ve keskin hatlarla Japon animasyon stili.', promptModifier: 'anime style, cel shaded, vibrant, japanese animation, studio ghibli inspired, detailed line work', icon: '✨', color: '#3b82f6' },
    { id: 'arabesk', name: 'Arabesk', description: "90'lar arabesk albüm kapağı estetiği.", promptModifier: "A hyper-kitsch 90's Turkish arabesk album cover, extremely dramatic and over-the-top.", icon: '🎤', color: '#7e22ce' },
    { id: 'tattoo', name: 'Dövme', description: 'Gerçekçi kol dövmesi simülasyonu.', promptModifier: 'Generate a photorealistic image of a man with his upper arm clearly visible in the frame.', icon: '💪', color: '#57534e' },
    { id: 'dugun', name: 'Düğün', description: 'İki kişilik düğün fotoğrafı.', promptModifier: 'Ultra-realistic, highly detailed, close-up cinematic portrait of a groom in a grey suit and a bride in a lace wedding dress, shaking hands. light blue, cloudy, and moody background. Dramatic studio lighting. Photorealistic. (Gri takım elbiseli bir damat ve dantelli gelinlikli bir gelinin el sıkıştığı ultra gerçekçi, çok detaylı, yakın çekim sinematik portresi. açık mavi mavi, bulutlu ve karamsar arka plan. Dramatik stüdyo aydınlatması. Foto-gerçekçi.)', icon: '💑', color: '#ec4899', requiresTwoPhotos: true }
];

export default function StyleResultScreen({ imageUri, imageBase64, onBack, userId, credits, onCreditsUpdate, onPurchasePress }) {
    const [selectedStyle, setSelectedStyle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resultImage, setResultImage] = useState(null);
    const [availableStyles, setAvailableStyles] = useState([]);
    const [stylesLoading, setStylesLoading] = useState(true);
    const [image2, setImage2] = useState(null); // { uri, base64 }

    useEffect(() => {
        fetchStyles();
    }, []);

    const fetchStyles = async () => {
        try {
            const response = await fetch(`${API_URL}/api/styles`);
            const data = await response.json();
            if (response.ok && data.styles) {
                const formattedStyles = data.styles.map(s => ({
                    id: s.style_id,
                    name: s.name,
                    description: s.description,
                    promptModifier: s.prompt_modifier,
                    icon: s.icon,
                    color: s.color,
                    requiresTwoPhotos: s.requires_two_photos
                }));
                setAvailableStyles(formattedStyles);
            } else {
                setAvailableStyles(STYLES);
            }
        } catch (error) {
            console.log('Using hardcoded styles, API fetch failed:', error);
            setAvailableStyles(STYLES);
        } finally {
            setStylesLoading(false);
        }
    };

    const handleSave = async () => {
        if (!resultImage) return;

        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('İzin Gerekli', 'Fotoğrafı kaydetmek için galeriye erişim izni vermelisiniz.');
                return;
            }

            const base64Code = resultImage.replace(/^data:image\/\w+;base64,/, "");
            const filename = FileSystem.documentDirectory + "styled_photo.png";

            await FileSystem.writeAsStringAsync(filename, base64Code, { encoding: 'base64' });
            await MediaLibrary.saveToLibraryAsync(filename);
            Alert.alert('Başarılı', 'Fotoğraf galeriye kaydedildi!');
        } catch (error) {
            Alert.alert('Hata', 'Kaydetme başarısız: ' + error.message);
        }
    };

    const pickSecondImage = async (style) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const secondImage = result.assets[0];
            setImage2(secondImage);
            // Automatically apply style after selecting second image
            applyStyleWithImages(style, secondImage.base64);
        }
    };

    const handleApplyStyle = async (style) => {
        if (!style || !imageBase64) return;
        setSelectedStyle(style);

        if (style.requiresTwoPhotos && !image2) {
            Alert.alert(
                'İkinci Fotoğraf Gerekli',
                'Bu stil için ikinci bir fotoğraf (eşiniz/partneriniz) seçmelisiniz.',
                [
                    { text: 'İptal', style: 'cancel' },
                    { text: 'Fotoğraf Seç', onPress: () => pickSecondImage(style) }
                ]
            );
            return;
        }

        applyStyleWithImages(style, image2?.base64);
    };

    const applyStyleWithImages = async (style, secondImageBase64) => {
        setLoading(true);
        try {
            const result = await generateStyledImage(
                imageBase64,
                style.promptModifier,
                userId,
                secondImageBase64
            );

            if (result.type === 'image') {
                setResultImage(`data:image/png;base64,${result.data}`);
                // Refresh credits after successful generation
                if (onCreditsUpdate) {
                    onCreditsUpdate();
                }
            }
        } catch (error) {
            // Check if it's a credit error
            if (error.message.includes('Yetersiz kredi')) {
                Alert.alert(
                    'Yetersiz Kredi',
                    'Stil uygulamak için krediniz yeterli değil. Kredi almak ister misiniz?',
                    [
                        { text: 'İptal', style: 'cancel' },
                        {
                            text: 'Kredi Al',
                            onPress: () => {
                                if (onPurchasePress) {
                                    onPurchasePress();
                                }
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Hata', error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <IconButton icon="arrow-left" size={24} iconColor="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editör</Text>
                <View style={styles.headerRight}>
                    {resultImage ? (
                        <TouchableOpacity onPress={handleSave}>
                            <Text style={styles.saveButton}>Kaydet</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.creditsBadge}>
                            <Text style={styles.creditsIcon}>⭐</Text>
                            <Text style={styles.creditsValue}>{credits || 0}</Text>
                        </View>
                    )}
                </View>
            </SafeAreaView>

            {/* Image Preview */}
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: resultImage || imageUri }}
                    style={styles.image}
                    resizeMode="cover"
                />
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>Oluşturuluyor...</Text>
                    </View>
                )}
                {image2 && !resultImage && (
                    <View style={styles.secondImagePreview}>
                        <Image source={{ uri: image2.uri }} style={styles.secondImage} />
                        <View style={styles.plusBadge}>
                            <Text style={styles.plusText}>+</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Bottom Style Selector */}
            <SafeAreaView edges={['bottom']} style={styles.bottomSheet}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.styleList}
                >
                    {stylesLoading ? (
                        // Skeleton Loading State
                        Array.from({ length: 6 }).map((_, index) => (
                            <View key={index} style={styles.styleItem}>
                                <View style={[styles.styleIconContainer, { backgroundColor: '#f5f5f5' }]}>
                                    <ActivityIndicator size="small" color="#ddd" />
                                </View>
                                <View style={{ width: 40, height: 10, backgroundColor: '#f5f5f5', borderRadius: 4, marginTop: 4 }} />
                            </View>
                        ))
                    ) : (
                        availableStyles.map((style) => {
                            const isSelected = selectedStyle?.id === style.id;
                            return (
                                <TouchableOpacity
                                    key={style.id}
                                    onPress={() => handleApplyStyle(style)}
                                    style={styles.styleItem}
                                >
                                    <View style={[
                                        styles.styleIconContainer,
                                        isSelected && styles.styleIconSelected
                                    ]}>
                                        <Text style={styles.styleIcon}>{style.icon}</Text>
                                    </View>
                                    <Text style={[
                                        styles.styleName,
                                        isSelected && styles.styleNameSelected
                                    ]}>{style.name}</Text>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    saveButton: {
        color: '#0095f6',
        fontWeight: '600',
        fontSize: 16,
        marginRight: 8,
    },
    creditsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    creditsIcon: {
        fontSize: 16,
        marginRight: 4,
    },
    creditsValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    imageContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width,
        height: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 12,
        fontSize: 16,
        fontWeight: '500',
    },
    bottomSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    styleList: {
        paddingHorizontal: 16,
        gap: 16,
    },
    styleItem: {
        alignItems: 'center',
        width: 70,
    },
    styleIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    styleIconSelected: {
        backgroundColor: '#0095f6',
        borderWidth: 3,
        borderColor: '#0095f6',
    },
    styleIcon: {
        fontSize: 28,
    },
    styleName: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
    },
    styleNameSelected: {
        color: '#000',
        fontWeight: '600',
    },
    secondImagePreview: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
        overflow: 'hidden',
    },
    secondImage: {
        width: '100%',
        height: '100%',
    },
    plusBadge: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: '#0095f6',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    plusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
