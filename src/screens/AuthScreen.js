import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated, ActivityIndicator, Alert, Platform } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { supabase } from '../services/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 3000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
            ])
        ).start();

        handleGuestLogin();
    }, []);

    const handleGuestLogin = async () => {
        try {
            const timestamp = new Date().getTime();
            const random = Math.floor(Math.random() * 10000);
            // Use local domain, alphanumeric only to prevent regex issues.
            const guestEmail = `guest${timestamp}${random}@satriq.app`;
            const guestPassword = `GuestPass${timestamp}!`;

            const { data, error } = await supabase.auth.signUp({
                email: guestEmail,
                password: guestPassword,
                options: {
                    data: { is_guest: true }
                }
            });

            if (error) throw error;

            // Critical Check: If no session, it means Auto-Confirm is OFF and Supabase is sending emails (causing bounces).
            if (!data.session) {
                Alert.alert(
                    'Kritik Ayar Eksik ⚠️',
                    'Uygulama "Email Confirmation" beklediği için takıldı.\n\nMisafir girişinin çalışması ve maillerin "bounce" etmemesi için:\nSupabase > Authentication > Providers > Email > "Enable Email Confirmations" ayarını KAPATIN.',
                    [{ text: 'Tekrar Dene', onPress: handleGuestLogin }]
                );
            }
            // Success: Auth state listener in App.js will redirect
        } catch (error) {
            Alert.alert('Bağlantı Hatası', 'Giriş yapılamadı: ' + error.message, [
                { text: 'Tekrar Dene', onPress: handleGuestLogin }
            ]);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#000', '#0a0a0a', '#111']} style={StyleSheet.absoluteFill} />

            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <Animated.View style={[styles.blob, { transform: [{ scale: pulseAnim }], opacity: 0.15 }]}>
                    <LinearGradient colors={['#10b981', 'transparent']} style={styles.blobGradient} start={{ x: 0.5, y: 0.5 }} end={{ x: 1, y: 1 }} />
                </Animated.View>
            </View>

            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>Satrik</Text>
                    <View style={styles.logoIconWrapper}>
                        <Icon source="star" size={24} color="#10b981" />
                    </View>
                </View>
                <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
                <Text style={styles.loadingText}>Başlatılıyor...</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        zIndex: 10,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 42,
        fontWeight: '800',
        color: '#fff',
        fontFamily: Platform.select({ ios: 'Arial Rounded MT Bold', android: 'sans-serif-rounded' }),
        letterSpacing: -1,
    },
    logoIconWrapper: {
        marginTop: 4,
        marginLeft: -4,
        transform: [{ rotate: '15deg' }]
    },
    loadingText: {
        color: '#666',
        marginTop: 16,
        fontSize: 14,
        letterSpacing: 1,
    },
    blob: {
        width: width * 1.5,
        height: width * 1.5,
        borderRadius: width,
        position: 'absolute',
        top: -width * 0.4,
        left: -width * 0.2,
    },
    blobGradient: {
        flex: 1,
        borderRadius: width,
    },
});
