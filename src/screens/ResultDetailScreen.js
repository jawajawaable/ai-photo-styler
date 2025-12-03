import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert, Share, Dimensions } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../services/supabaseClient';

const { width, height } = Dimensions.get('window');

export default function ResultDetailScreen({ job, onBack, onDelete }) {
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!job.result_image_url) return;

        setSaving(true);
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('İzin Gerekli', 'Fotoğrafı kaydetmek için galeriye erişim izni vermelisiniz.');
                return;
            }

            // Download image
            const filename = FileSystem.documentDirectory + `satrayni_${job.style_name}_${Date.now()}.jpg`;
            const downloadResult = await FileSystem.downloadAsync(job.result_image_url, filename);

            // Save to library
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
                message: `Satrayni ile oluşturdum: ${job.style_name}`,
                url: job.result_image_url,
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Fotoğrafı Sil',
            'Bu fotoğrafı silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
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
                        }
                    },
                },
            ]
        );
    };

    const handleReport = () => {
        Alert.alert('Rapor Et', 'Bu özellik yakında eklenecek.');
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Icon source="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleReport} style={styles.reportButton}>
                    <Icon source="alert-circle-outline" size={20} color="#888" />
                    <Text style={styles.reportText}>Report</Text>
                </TouchableOpacity>
            </SafeAreaView>

            {/* Image */}
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: job.result_image_url }}
                    style={styles.image}
                    resizeMode="contain"
                />
            </View>

            {/* Actions */}
            <SafeAreaView edges={['bottom']} style={styles.footer}>
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                        <View style={[styles.actionIcon, styles.saveIcon]}>
                            <Icon source="download" size={24} color="#000" />
                        </View>
                        <Text style={styles.actionText}>Save</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                        <View style={[styles.actionIcon, styles.shareIcon]}>
                            <Icon source="share-variant" size={24} color="#fff" />
                        </View>
                        <Text style={styles.actionText}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                        <View style={[styles.actionIcon, styles.deleteIcon]}>
                            <Icon source="delete" size={24} color="#fff" />
                        </View>
                        <Text style={styles.actionText}>Delete</Text>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    reportText: {
        color: '#888',
        fontSize: 14,
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width - 40,
        height: height * 0.7,
        borderRadius: 20,
    },
    footer: {
        paddingBottom: 20,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 40,
        paddingHorizontal: 40,
    },
    actionButton: {
        alignItems: 'center',
        gap: 8,
    },
    actionIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveIcon: {
        backgroundColor: '#fff',
    },
    shareIcon: {
        backgroundColor: '#333',
    },
    deleteIcon: {
        backgroundColor: '#333',
    },
    actionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
});
