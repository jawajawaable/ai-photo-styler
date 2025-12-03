import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, ImageBackground, Alert } from 'react-native';
import { Text, Icon, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../services/supabaseClient';
import * as FileSystem from 'expo-file-system/legacy';

const { width, height } = Dimensions.get('window');

export default function StyleDetailScreen({ style, onBack, onContinue, userId }) {
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
            setImage(result.assets[0]);
        }
    };

    const handleContinue = async () => {
        if (!image1) return;
        if (style.requires_two_photos && !image2) return;

        setCreating(true);
        try {
            // Upload images to Supabase Storage
            const timestamp = Date.now();
            const image1Path = `inputs/${userId}/${timestamp}_1.jpg`;

            // Read file as base64 using FileSystem
            const base64Image1 = await FileSystem.readAsStringAsync(image1.uri, {
                encoding: 'base64',
            });

            // Convert base64 to ArrayBuffer
            const binaryString1 = atob(base64Image1);
            const bytes1 = new Uint8Array(binaryString1.length);
            for (let i = 0; i < binaryString1.length; i++) {
                bytes1[i] = binaryString1.charCodeAt(i);
            }

            const { error: uploadError1 } = await supabase.storage
                .from('style-images')
                .upload(image1Path, bytes1.buffer, {
                    contentType: 'image/jpeg',
                    upsert: true,
                });

            if (uploadError1) throw uploadError1;

            const { data: { publicUrl: image1Url } } = supabase.storage
                .from('style-images')
                .getPublicUrl(image1Path);

            let image2Url = null;
            if (image2) {
                const image2Path = `inputs/${userId}/${timestamp}_2.jpg`;

                const base64Image2 = await FileSystem.readAsStringAsync(image2.uri, {
                    encoding: 'base64',
                });

                const binaryString2 = atob(base64Image2);
                const bytes2 = new Uint8Array(binaryString2.length);
                for (let i = 0; i < binaryString2.length; i++) {
                    bytes2[i] = binaryString2.charCodeAt(i);
                }

                const { error: uploadError2 } = await supabase.storage
                    .from('style-images')
                    .upload(image2Path, bytes2.buffer, {
                        contentType: 'image/jpeg',
                        upsert: true,
                    });

                if (uploadError2) throw uploadError2;

                const { data: { publicUrl: url2 } } = supabase.storage
                    .from('style-images')
                    .getPublicUrl(image2Path);
                image2Url = url2;
            }

            // Create job
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
                    estimated_completion: new Date(Date.now() + 60000).toISOString(), // 1 min from now
                }])
                .select()
                .single();

            if (jobError) throw jobError;

            console.log('Job created successfully:', job.id);

            // Navigate to profile
            onContinue({ style, images: [image1, image2] });
        } catch (error) {
            console.error('Error creating job:', error);
            Alert.alert('Hata', 'İşlem oluşturulamadı: ' + error.message);
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
                    <Icon source={icon} size={32} color="#666" />
                    <Text style={styles.uploadText}>{label}</Text>
                </View>
            )}
            {image && (
                <View style={styles.editBadge}>
                    <Icon source="pencil" size={16} color="#fff" />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                {/* Header Image Section */}
                <View style={styles.headerContainer}>
                    <ImageBackground
                        source={{ uri: style.image_url || 'https://via.placeholder.com/400' }}
                        style={styles.headerImage}
                        resizeMode="cover"
                    >
                        <LinearGradient
                            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', '#000']}
                            style={styles.gradient}
                        >
                            <SafeAreaView edges={['top']} style={styles.safeHeader}>
                                <TouchableOpacity onPress={onBack} style={styles.closeButton}>
                                    <Icon source="close" size={24} color="#000" />
                                </TouchableOpacity>
                            </SafeAreaView>

                            <View style={styles.headerTextContainer}>
                                <Text variant="headlineMedium" style={styles.title}>{style.name}</Text>
                                <Text variant="bodyMedium" style={styles.description}>
                                    {style.description}
                                </Text>
                            </View>
                        </LinearGradient>
                    </ImageBackground>
                </View>

                {/* Upload Section */}
                <View style={styles.contentContainer}>
                    <View style={styles.uploadGrid}>
                        {renderUploadButton(
                            image1,
                            setImage1,
                            "Senin fotoğrafın!",
                            "account"
                        )}

                        {style.requires_two_photos && renderUploadButton(
                            image2,
                            setImage2,
                            "Partnerinin fotoğrafı!",
                            "account-multiple"
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Footer Action */}
            <SafeAreaView edges={['bottom']} style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        (!image1 || (style.requires_two_photos && !image2) || creating) && styles.disabledButton
                    ]}
                    onPress={handleContinue}
                    disabled={!image1 || (style.requires_two_photos && !image2) || creating}
                >
                    {creating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.continueText}>Devam Et</Text>
                            <View style={styles.priceTag}>
                                <Icon source="star-four-points" size={16} color="#fff" />
                                <Text style={styles.priceText}>40</Text>
                            </View>
                        </>
                    )}
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 100,
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
    safeHeader: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextContainer: {
        padding: 24,
        paddingBottom: 40,
    },
    title: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 8,
        fontSize: 28,
    },
    description: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        lineHeight: 24,
    },
    contentContainer: {
        padding: 24,
        marginTop: -20,
    },
    uploadGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    uploadButton: {
        flex: 1,
        aspectRatio: 0.8,
        backgroundColor: '#f5f5f5',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    uploadPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    uploadText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 12,
        fontSize: 14,
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
    },
    editBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 6,
        borderRadius: 12,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    continueButton: {
        backgroundColor: '#6200ee',
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    disabledButton: {
        backgroundColor: '#ccc',
        opacity: 0.8,
    },
    continueText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    priceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    priceText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
