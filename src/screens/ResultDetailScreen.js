import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert, Share, Dimensions, StatusBar } from 'react-native';
import { Text, Icon, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../services/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ResultDetailScreen({ job, onBack, onDelete }) {
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleSave = async () => {
        if (!job.result_image_url) return;

        setSaving(true);
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('İzin Gerekli', 'Fotoğrafı kaydetmek için galeriye erişim izni vermelisiniz.');
                return;
            }

            const filename = FileSystem.documentDirectory + `satrik_${job.style_name}_${Date.now()}.jpg`;
            const downloadResult = await FileSystem.downloadAsync(job.result_image_url, filename);

            await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
            Alert.alert('Başarılı', 'Fotoğraf galeriye kaydedildi!');
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Hata', 'Kaydetme başarısız: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Satrik ile oluşturdum: ${job.style_name}`,
                url: job.result_image_url,
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Sil',
            'Bu fotoğrafı silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            const { error } = await supabase
                                .from('jobs')
                                .delete()
                                .eq('id', job.id);

                            if (error) throw error;

                            if (onDelete) onDelete(job.id);
                            onBack();
                        } catch (error) {
                            Alert.alert('Hata', 'Silme başarısız: ' + error.message);
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Ambient Background */}
            <Image
                source={{ uri: job.result_image_url }}
                style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
                blurRadius={80}
            />
            <LinearGradient
                colors={['rgba(0,0,0,0.85)', '#000']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                        <Icon source="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.jobInfoPill}>
                        <Icon source="creation" size={14} color="#10b981" />
                        <Text style={styles.jobStyleName}>{job.style_name}</Text>
                    </View>

                    <View style={{ width: 44 }} />
                </View>

                {/* Main Image Container */}
                <View style={styles.imageWrapper}>
                    <View style={styles.imageCard}>
                        <Image
                            source={{ uri: job.result_image_url }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                {/* Bottom Actions */}
                <View style={styles.actionsContainer}>
                    {/* Save Button */}
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        style={styles.mainActionButton}
                    >
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            style={styles.mainActionGradient}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Icon source="download" size={20} color="#fff" />
                                    <Text style={styles.mainActionText}>Kaydet</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Share Button */}
                    <TouchableOpacity onPress={handleShare} style={styles.iconActionButton}>
                        <Icon source="share-variant" size={24} color="#fff" />
                    </TouchableOpacity>

                    {/* Delete Button */}
                    <TouchableOpacity onPress={handleDelete} disabled={deleting} style={styles.iconActionButtonDanger}>
                        {deleting ? (
                            <ActivityIndicator color="#ef4444" size="small" />
                        ) : (
                            <Icon source="trash-can-outline" size={24} color="#ef4444" />
                        )}
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
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
        alignItems: 'center',
        justifyContent: 'space-between',
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
    jobInfoPill: {
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
    jobStyleName: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    imageWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    imageCard: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
    },
    mainActionButton: {
        flex: 1,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
    },
    mainActionGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    mainActionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    iconActionButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    iconActionButtonDanger: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
});
