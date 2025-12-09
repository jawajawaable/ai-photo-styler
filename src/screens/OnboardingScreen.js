import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = '@satrayni_onboarding_complete';

export default function OnboardingScreen({ onComplete }) {
    const handleGetStarted = async () => {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        onComplete();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text variant="displayMedium" style={styles.title}>
                    SATRAYNI
                </Text>
                <Text variant="headlineSmall" style={styles.subtitle}>
                    AI Photo Styler
                </Text>
                <Text style={styles.description}>
                    Fotoğraflarınıza harika AI stilleri uygulayın
                </Text>
            </View>

            <View style={styles.footer}>
                <Button
                    mode="contained"
                    onPress={handleGetStarted}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                >
                    Başlayın
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
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontWeight: 'bold',
        color: '#6200ee',
        marginBottom: 10,
        letterSpacing: 2,
    },
    subtitle: {
        color: '#333',
        marginBottom: 20,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
    },
    footer: {
        padding: 20,
    },
    button: {
        borderRadius: 28,
    },
    buttonContent: {
        height: 56,
    },
});
