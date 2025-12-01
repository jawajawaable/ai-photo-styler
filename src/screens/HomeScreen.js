import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Surface, Icon, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function HomeScreen({ onImageSelected }) {
    const theme = useTheme();

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            onImageSelected(result.assets[0]);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text variant="displaySmall" style={styles.title}>Sanatını</Text>
                <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary, fontWeight: 'bold' }]}>
                    Keşfet
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                    Fotoğraflarını yapay zeka ile eşsiz sanat eserlerine dönüştür.
                </Text>
            </View>

            <View style={styles.content}>
                <TouchableOpacity onPress={pickImage} activeOpacity={0.9}>
                    <Surface style={styles.uploadCard} elevation={2}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                            <Icon source="image-plus" size={40} color={theme.colors.primary} />
                        </View>
                        <Text variant="titleLarge" style={styles.cardTitle}>Fotoğraf Seç</Text>
                        <Text variant="bodyMedium" style={styles.cardSubtitle}>Galerinden bir fotoğraf yükle</Text>
                    </Surface>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 20,
    },
    title: {
        lineHeight: 40,
    },
    subtitle: {
        marginTop: 12,
        color: '#666',
        lineHeight: 22,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    uploadCard: {
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#eee',
        height: 300,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    cardSubtitle: {
        color: '#888',
    },
});
