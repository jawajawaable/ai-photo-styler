import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, ImageBackground, Alert, StatusBar } from 'react-native';
import { Text, Icon, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../services/supabaseClient';
import * as FileSystem from 'expo-file-system/legacy';
import PremiumLoading from '../components/PremiumLoading';

const { width, height } = Dimensions.get('window');

export default function StyleDetailScreen({ style, onBack, onContinue, userId, credits, onPurchasePress }) {
    const insets = useSafeAreaInsets();
    const [image1, setImage1] = useState(null);
    const [image2, setImage2] = useState(null);
    const [creating, setCreating] = useState(false);

    const pickImage = async (setImage) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled) {
            const asset = result.assets[0];

            // Image Optimization Logic
            const actions = [];
            const MAX_DIMENSION = 1080;

            if (asset.width > MAX_DIMENSION || asset.height > MAX_DIMENSION) {
                if (asset.width > asset.height) {
                    actions.push({ resize: { width: MAX_DIMENSION } });
                } else {
                    actions.push({ resize: { height: MAX_DIMENSION } });
                }
            }

            try {
                const manipResult = await ImageManipulator.manipulateAsync(
                    asset.uri,
                    actions,
                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                );
                setImage(manipResult);
            } catch (error) {
                console.error('Image optimization failed:', error);
                // Fallback to original if optimization fails
                setImage(asset);
            }
        }
    };

    const handleContinue = async () => {
        if (!image1) return;

        if (!credits || credits < 1) {
            Alert.alert(
                '⭐ Yetersiz Kredi',
                'Görsel oluşturmak için en az 1 krediniz olmalı.',
                [
                    { text: 'İptal', style: 'cancel' },
                    { text: 'Kredi Al', onPress: () => onPurchasePress && onPurchasePress() }
                ]
            );
            return;
        }
        if (style.requires_two_photos && !image2) return;

        setCreating(true);
        try {
            const timestamp = Date.now();
            const image1Path = `inputs/${userId}/${timestamp}_1.jpg`;

            const base64Image1 = await FileSystem.readAsStringAsync(image1.uri, { encoding: 'base64' });
            const binaryString1 = atob(base64Image1);
            const bytes1 = new Uint8Array(binaryString1.length);
            for (let i = 0; i < binaryString1.length; i++) bytes1[i] = binaryString1.charCodeAt(i);

            const { error: uploadError1 } = await supabase.storage
                .from('style-images')
                .upload(image1Path, bytes1.buffer, { contentType: 'image/jpeg', upsert: true });

            if (uploadError1) throw uploadError1;

            const { data: { publicUrl: image1Url } } = supabase.storage
                .from('style-images')
                .getPublicUrl(image1Path);

            let image2Url = null;
            if (image2) {
                const image2Path = `inputs/${userId}/${timestamp}_2.jpg`;
                const base64Image2 = await FileSystem.readAsStringAsync(image2.uri, { encoding: 'base64' });
                const binaryString2 = atob(base64Image2);
                const bytes2 = new Uint8Array(binaryString2.length);
                for (let i = 0; i < binaryString2.length; i++) bytes2[i] = binaryString2.charCodeAt(i);

                const { error: uploadError2 } = await supabase.storage
                    .from('style-images')
                    .upload(image2Path, bytes2.buffer, { contentType: 'image/jpeg', upsert: true });

                if (uploadError2) throw uploadError2;

                const { data: { publicUrl: url2 } } = supabase.storage.from('style-images').getPublicUrl(image2Path);
                image2Url = url2;
            }

            const { data: job, error: jobError } = await supabase
                .from('jobs')
                .insert([{
                    user_id: userId,
                    style_id: style.style_id,
                    style_name: style.name,
                    input_image_url: image1Url,
                    input_image2_url: image2Url,
                    prompt: style.prompt_modifier,
                    status: 'pending',
                    estimated_completion: new Date(Date.now() + 60000).toISOString(),
                }])
                .select()
                .single();

            if (jobError) throw jobError;

            try {
                await fetch('https://ai-photo-styler-1-hozn.onrender.com/api/process-jobs', { method: 'POST' });
            } catch (triggerError) {
                console.log('Background trigger sent');
            }

            onContinue({ style, images: [image1, image2] });
        } catch (error) {
            console.error('Error creating job:', error);
            Alert.alert('Hata', 'İşlem oluşturulamadı.');
        } finally {
            setCreating(false);
        }
    };

    const renderUploadButton = (image, setImage, label, icon) => (
        <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImage(setImage)}
            activeOpacity={0.8}
        >
            {image ? (
                <Image source={{ uri: image.uri }} style={styles.uploadedImage} resizeMode="cover" />
            ) : (
                <View style={styles.uploadPlaceholder}>
                    <View style={styles.iconCircle}>
                        <Icon source={icon} size={28} color="#fff" />
                    </View>
                    <Text style={styles.uploadText}>{label}</Text>
                    <Text style={styles.uploadSubtext}>Seçmek için dokun</Text>
                </View>
            )}
            {image && (
                <View style={styles.editBadge}>
                    <Icon source="pencil" size={14} color="#000" />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <PremiumLoading visible={creating} />
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
                {/* Immersive Header Image */}
                <View style={styles.headerContainer}>
                    <ImageBackground
                        source={{ uri: style.image_url || 'https://via.placeholder.com/400' }}
                        style={styles.headerImage}
                        resizeMode="cover"
                    >
                        <LinearGradient
                            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', '#000']}
                            style={styles.gradient}
                        >
                            <View style={[styles.headerTop, { paddingTop: insets.top + 10 }]}>
                                <TouchableOpacity onPress={onBack} style={styles.closeButton}>
                                    <Icon source="arrow-left" size={24} color="#fff" />
                                </TouchableOpacity>

                                <View style={styles.creditsPill}>
                                    <Text style={styles.creditsValue}>{credits || 0}</Text>
                                    <View style={styles.creditsDot} />
                                </View>
                            </View>

                            <View style={styles.headerTextContainer}>
                                <Text style={styles.title}>{style.name}</Text>
                                <Text style={styles.description}>{style.description}</Text>
                            </View>
                        </LinearGradient>
                    </ImageBackground>
                </View>

                {/* Content Section */}
                <View style={styles.contentContainer}>
                    {/* Tip Card */}
                    <View style={styles.tipCard}>
                        <LinearGradient
                            colors={['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.05)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.tipGradient}
                        >
                            <View style={styles.tipContent}>
                                <View style={styles.tipIconContainer}>
                                    <Icon source="lightbulb-on-outline" size={20} color="#10b981" />
                                </View>
                                <View style={styles.tipTextContainer}>
                                    <Text style={styles.tipTitle}>Mükemmel Sonuç İçin</Text>
                                    <Text style={styles.tipDescription}>
                                        Yüzünüzün net göründüğü, aydınlık bir fotoğraf seçin. Gözlük veya şapka takmamaya özen gösterin.
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    <Text style={styles.sectionTitle}>Fotoğraf Yükle</Text>
                    <View style={styles.uploadGrid}>
                        {renderUploadButton(image1, setImage1, "Senin Fotoğrafın", "account")}
                        {style.requires_two_photos && renderUploadButton(image2, setImage2, "Partnerin", "account-group")}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        (!image1 || (style.requires_two_photos && !image2) || creating) && styles.disabledButton
                    ]}
                    onPress={handleContinue}
                    disabled={!image1 || (style.requires_two_photos && !image2) || creating}
                >
                    <LinearGradient
                        colors={['#10b981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <View style={styles.buttonContent}>
                            <Text style={styles.continueText}>Oluştur</Text>
                            <View style={styles.priceContainer}>
                                <Icon source="star-four-points" size={14} color="#fff" />
                                <Text style={styles.priceText}>1</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 120,
    },
    headerContainer: {
        height: height * 0.55,
        width: '100%',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        flex: 1,
        justifyContent: 'space-between',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    creditsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    creditsValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    creditsDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10b981',
    },
    headerTextContainer: {
        padding: 24,
        paddingBottom: 40,
    },
    title: {
        color: '#fff',
        fontWeight: '900',
        marginBottom: 8,
        fontSize: 32,
        letterSpacing: -0.5,
    },
    description: {
        color: '#cbd5e1',
        fontSize: 16,
        lineHeight: 24,
    },
    contentContainer: {
        padding: 24,
        marginTop: -30,
    },
    tipCard: {
        marginBottom: 24,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    tipGradient: {
        padding: 16,
    },
    tipContent: {
        flexDirection: 'row',
        gap: 12,
    },
    tipIconContainer: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        padding: 8,
        borderRadius: 12,
        height: 36,
        width: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tipTextContainer: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    tipDescription: {
        fontSize: 13,
        color: '#9ca3af',
        lineHeight: 18,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 16,
    },
    uploadGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    uploadButton: {
        flex: 1,
        aspectRatio: 0.8,
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    uploadPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#262626',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    uploadText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 15,
    },
    uploadSubtext: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
    },
    editBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 100,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(0,0,0,0.9)',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#1a1a1a',
    },
    continueButton: {
        borderRadius: 100,
        overflow: 'hidden',
    },
    gradientButton: {
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    continueText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        gap: 4,
    },
    priceText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
});
