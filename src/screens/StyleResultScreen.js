import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert, TouchableOpacity, Dimensions, Share, StatusBar } from 'react-native';
import { Text, Icon, ActivityIndicator, Portal, Modal, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateStyledImage } from '../services/geminiService';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumLoading from '../components/PremiumLoading';

const API_URL = 'https://ai-photo-styler-1-hozn.onrender.com';
const { width, height } = Dimensions.get('window');

const STYLES = [
    { id: 'vesikalik', name: 'Vesikalık', description: 'Resmi belgeler için klasik mavi arka planlı vesikalık fotoğraf tarzı.', promptModifier: 'A centered portrait of a man against a solid blue background with a gentle gradient (slightly darker at the bottom, lighter at the top). Expression is neutral and formal, looking directly at the camera. The lighting is bright, soft, and evenly distributed, similar to a Turkish ID/passport photo. Shoulders visible, head fully centered, no dramatic shadows, no artistic effects. Simple, clean, official studio portrait style.', icon: 'account-tie', color: '#1d4ed8' },
    { id: 'bulut', name: 'Bulut', description: 'Mavi gökyüzü ve beyaz bulutlar önünde neşeli bir kolaj.', promptModifier: 'A collage features six different images of the same person with a fair skin tone and dark hair, set against a backdrop of a bright blue sky with scattered white clouds. With a prominent smile in most of the shots.', icon: 'cloud', color: '#0ea5e9' },
    { id: 'gryffindor', name: 'Gryffindor', description: 'Kırmızı ve altın renkli sancaklarla büyüleyici Hogwarts atmosferi.', promptModifier: 'A full-body, indoor photo of a young adult male with fair skin and dark brown hair, standing centered in front of a red and gold banner.', icon: 'flag', color: '#b91c1c' },
    { id: 'osmanli', name: 'Osmanlı', description: 'Geleneksel Osmanlı minyatür sanatı, düz perspektif ve zengin motifler.', promptModifier: '2D Ottoman miniature illustration style. Highly detailed and ornate with vibrant and symbolic color use.', icon: 'mosque', color: '#b45309' },
    { id: 'asker', name: 'Asker', description: "90'lar Türk askeri fotoğraf stüdyosu estetiği.", promptModifier: 'A surreal and kitschy digital collage inspired by 90s Turkish military photo studio posters.', icon: 'shield-star', color: '#065f46' },
    { id: 'devrimci', name: 'Devrimci', description: 'İkonik, siyah-beyaz ve karizmatik devrimci poster estetiği.', promptModifier: 'A powerful and iconic revolutionary portrait shot with a 40–50 mm lens.', icon: 'star', color: '#44403c' },
    { id: 'anime', name: 'Anime', description: 'Canlı renkler ve keskin hatlarla Japon animasyon stili.', promptModifier: 'anime style, cel shaded, vibrant, japanese animation, studio ghibli inspired, detailed line work', icon: 'auto-fix', color: '#3b82f6' },
    { id: 'arabesk', name: 'Arabesk', description: "90'lar arabesk albüm kapağı estetiği.", promptModifier: "A hyper-kitsch 90's Turkish arabesk album cover, extremely dramatic and over-the-top.", icon: 'microphone', color: '#7e22ce' },
    { id: 'tattoo', name: 'Dövme', description: 'Gerçekçi kol dövmesi simülasyonu.', promptModifier: 'Generate a photorealistic image of a man with his upper arm clearly visible in the frame.', icon: 'arm-flex', color: '#57534e' },
    { id: 'dugun', name: 'Düğün', description: 'İki kişilik düğün fotoğrafı.', promptModifier: 'Ultra-realistic, highly detailed, close-up cinematic portrait of a groom in a grey suit and a bride in a lace wedding dress, shaking hands. light blue, cloudy, and moody background. Dramatic studio lighting. Photorealistic. (Gri takım elbiseli bir damat ve dantelli gelinlikli bir gelinin el sıkıştığı ultra gerçekçi, çok detaylı, yakın çekim sinematik portresi. açık mavi mavi, bulutlu ve karamsar arka plan. Dramatik stüdyo aydınlatması. Foto-gerçekçi.)', icon: 'heart', color: '#ec4899', requiresTwoPhotos: true }
];

export default function StyleResultScreen({ inputImages, onBack, userId, credits, onCreditsUpdate, onPurchasePress, initialStyle }) {
    const [selectedStyle, setSelectedStyle] = useState(initialStyle || null);
    const [loading, setLoading] = useState(false);
    const [resultImage, setResultImage] = useState(null);
    const [availableStyles, setAvailableStyles] = useState([]);
    const [stylesLoading, setStylesLoading] = useState(true);
    const [showCreditDialog, setShowCreditDialog] = useState(false);

    const image1 = inputImages && inputImages[0];
    const image2 = inputImages && inputImages[1];

    useEffect(() => {
        fetchStyles();
    }, []);

    useEffect(() => {
        if (initialStyle && image1 && !loading && !resultImage) {
            handleApplyStyle(initialStyle);
        }
    }, [initialStyle, image1]);

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
                    icon: s.icon || 'star',
                    color: s.color || '#666',
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

            let base64Code;
            if (resultImage.startsWith('http')) {
                const response = await fetch(resultImage);
                const blob = await response.blob();
                const reader = new FileReader();

                base64Code = await new Promise((resolve, reject) => {
                    reader.onloadend = () => {
                        const base64 = reader.result.replace(/^data:image\/\w+;base64,/, "");
                        resolve(base64);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } else {
                base64Code = resultImage.replace(/^data:image\/\w+;base64,/, "");
            }

            const filename = FileSystem.documentDirectory + "styled_photo.png";
            await FileSystem.writeAsStringAsync(filename, base64Code, { encoding: 'base64' });
            await MediaLibrary.saveToLibraryAsync(filename);
            Alert.alert('Başarılı', 'Fotoğraf galeriye kaydedildi!');
        } catch (error) {
            Alert.alert('Hata', 'Kaydetme başarısız: ' + error.message);
        }
    };

    const handleShare = async () => {
        if (!resultImage) return;
        try {
            if (resultImage.startsWith('http')) {
                await Share.share({
                    message: 'Satrik ile oluşturuldu!',
                    url: resultImage,
                });
            } else {
                Alert.alert('Bilgi', 'Paylaşmak için önce fotoğrafı kaydedin.');
            }
        } catch (error) {
            console.log('Share error:', error);
        }
    };

    const handleApplyStyle = async (style) => {
        if (!style || !image1) return;
        setSelectedStyle(style);
        applyStyleWithImages(style);
    };

    const applyStyleWithImages = async (style) => {
        if (!image1) {
            Alert.alert('Hata', 'Fotoğraf bulunamadı');
            return;
        }

        setLoading(true);
        try {
            const result = await generateStyledImage(
                image1.base64,
                style.promptModifier,
                userId,
                image2?.base64
            );

            if (result.type === 'image') {
                setResultImage(`data:image/png;base64,${result.data}`);
                if (onCreditsUpdate) {
                    onCreditsUpdate();
                }
            }
        } catch (error) {
            if (error.message.includes('Yetersiz kredi')) {
                setShowCreditDialog(true);
            } else {
                Alert.alert('Hata', error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBuyCredits = () => {
        setShowCreditDialog(false);
        if (onPurchasePress) {
            onPurchasePress();
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Ambient Background */}
            <Image
                source={{ uri: resultImage || inputImages?.[0]?.uri }}
                style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
                blurRadius={80}
            />
            <LinearGradient
                colors={['rgba(0,0,0,0.85)', '#000']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

                <PremiumLoading visible={loading} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                        <Icon source="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>

                    {!resultImage && (
                        <View style={styles.creditsPill}>
                            <Text style={styles.creditsValue}>{credits || 0}</Text>
                            <View style={styles.creditsDot} />
                        </View>
                    )}
                </View>

                {/* Main Content Area */}
                <View style={styles.contentContainer}>
                    <View style={styles.imageCard}>
                        <Image
                            source={{ uri: resultImage || inputImages?.[0]?.uri }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                {/* Footer Actions */}
                <View style={styles.footer}>
                    {/* Action Buttons */}
                    {resultImage && (
                        <View style={styles.actionButtonsContainer}>
                            <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
                                <LinearGradient
                                    colors={['#10b981', '#059669']}
                                    style={styles.actionButtonGradient}
                                >
                                    <Icon source="download" size={20} color="#fff" />
                                    <Text style={styles.actionButtonText}>Kaydet</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleShare} style={styles.iconActionButton}>
                                <Icon source="share-variant" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Style Selector */}
                    <View style={styles.styleSelectorContainer}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.styleList}
                        >
                            {stylesLoading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <View key={index} style={styles.skeletonItem} />
                                ))
                            ) : (
                                availableStyles.map((style) => {
                                    const isSelected = selectedStyle?.id === style.id;
                                    return (
                                        <TouchableOpacity
                                            key={style.id}
                                            onPress={() => handleApplyStyle(style)}
                                            style={[styles.styleItem, isSelected && styles.styleItemSelected]}
                                        >
                                            <View style={[styles.styleIconContainer, isSelected && { backgroundColor: '#10b981' }]}>
                                                <Icon source={style.icon} size={20} color={isSelected ? '#fff' : '#fff'} />
                                            </View>
                                            <Text style={[styles.styleName, isSelected && styles.styleNameSelected]}>
                                                {style.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </ScrollView>
                    </View>
                </View>
            </SafeAreaView>

            {/* Credits Modal */}
            <Portal>
                <Modal
                    visible={showCreditDialog}
                    onDismiss={() => setShowCreditDialog(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconContainer}>
                            <Icon source="star-four-points" size={32} color="#10b981" />
                        </View>
                        <Text style={styles.modalTitle}>Yetersiz Kredi</Text>
                        <Text style={styles.modalText}>
                            Devam etmek için krediye ihtiyacınız var.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setShowCreditDialog(false)} style={styles.modalButtonSecondary}>
                                <Text style={styles.modalButtonTextSecondary}>Vazgeç</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleBuyCredits} style={styles.modalButtonPrimary}>
                                <Text style={styles.modalButtonTextPrimary}>Kredi Al</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    creditsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: '#333',
    },
    creditsValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    creditsDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10b981',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    imageCard: {
        width: '100%',
        height: '100%',
        borderRadius: 0, // Removed radius
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    footer: {
        paddingBottom: 20,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    actionButton: {
        flex: 1,
        borderRadius: 100,
        overflow: 'hidden',
    },
    actionButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    iconActionButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    styleSelectorContainer: {
        height: 90,
    },
    styleList: {
        paddingHorizontal: 20,
        gap: 12,
        alignItems: 'center',
    },
    styleItem: {
        alignItems: 'center',
        padding: 8,
        borderRadius: 16,
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
        width: 72,
    },
    styleItemSelected: {
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    styleIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    styleName: {
        fontSize: 11,
        color: '#888',
        fontWeight: '500',
    },
    styleNameSelected: {
        color: '#fff',
        fontWeight: '700',
    },
    skeletonItem: {
        width: 70,
        height: 80,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
    },
    modalContainer: {
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        padding: 24,
        width: width * 0.85,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    modalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    modalText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButtonPrimary: {
        flex: 1,
        backgroundColor: '#10b981',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonSecondary: {
        flex: 1,
        backgroundColor: '#333',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonTextPrimary: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    modalButtonTextSecondary: {
        color: '#ccc',
        fontWeight: '600',
        fontSize: 15,
    },
});
