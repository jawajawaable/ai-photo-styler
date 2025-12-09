import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const LOADING_TIPS = [
    "Biliyor muydunuz? Farklı açılar, tamamen farklı sonuçlar yaratabilir.",
    "Yapay zeka, ışık ve gölgeleri fotoğrafa göre optimize ediyor.",
    "Yüksek çözünürlüklü fotoğraflar her zaman daha iyi sonuç verir.",
    "Modelimiz yüz hatlarını koruyarak sanatsal bir dokunuş ekliyor.",
    "Renk paletleri, stilin ruhunu yansıtacak şekilde seçiliyor.",
    "Sihirli dokunuşlar ekleniyor, birazdan hazır olacak...",
    "Kompozisyon analiz ediliyor...",
    "Harika bir sonuç için son rötuşlar yapılıyor..."
];

export default function PremiumLoading({ visible }) {
    const [tipIndex, setTipIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.1,
                        duration: 1000,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease),
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 0.9,
                        duration: 1000,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease),
                    }),
                ])
            ).start();

            // Rotate animation
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                    easing: Easing.linear,
                })
            ).start();

            // Progress animation (non-native driver for width)
            Animated.loop(
                Animated.timing(progressAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: false, // Important: width does not support native driver
                    easing: Easing.linear,
                })
            ).start();

            // Tips rotation
            const interval = setInterval(() => {
                Animated.sequence([
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }).start();
                });
            }, 2500);

            // Initial fade in
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            return () => clearInterval(interval);
        }
    }, [visible]);

    if (!visible) return null;

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(0,0,0,0.95)', '#000']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>
                <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
                    <LinearGradient
                        colors={['rgba(16, 185, 129, 0.2)', 'rgba(0,0,0,0)']}
                        style={styles.glow}
                    />
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                        <Icon source="star-four-points" size={48} color="#10b981" />
                    </Animated.View>
                </Animated.View>

                <Animated.Text style={[styles.tipText, { opacity: fadeAnim }]}>
                    {LOADING_TIPS[tipIndex]}
                </Animated.Text>

                <View style={styles.progressBar}>
                    <Animated.View style={[styles.progressIndicator, {
                        width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%']
                        })
                    }]} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 40,
    },
    iconContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    glow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    tipText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 30,
        height: 28, // Height for single line
    },
    progressBar: {
        width: width * 0.6,
        height: 4,
        backgroundColor: '#333',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressIndicator: {
        height: '100%',
        backgroundColor: '#10b981',
    },
});
