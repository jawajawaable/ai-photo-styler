import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, Dimensions, StatusBar, Platform } from 'react-native';
import { Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const starScaleAnim = useRef(new Animated.Value(0)).current;
    const starRotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Orchestrate animations
        Animated.sequence([
            // 1. Fade in and scale up logo text
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ]),
            // 2. Pop the star icon
            Animated.spring(starScaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
            // 3. Rotate star slightly for flair
            Animated.timing(starRotateAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            // 4. Hold for a moment
            Animated.delay(800),
        ]).start(() => {
            // Finish splash
            if (onFinish) onFinish();
        });
    }, []);

    const spin = starRotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '15deg'], // Land on the custom playful angle
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <LinearGradient
                colors={['#000', '#0a0a0a', '#111']}
                style={StyleSheet.absoluteFill}
            />

            <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.logoText}>Satrik</Text>

                <Animated.View style={[
                    styles.logoIconWrapper,
                    {
                        transform: [
                            { scale: starScaleAnim },
                            { rotate: spin }
                        ]
                    }
                ]}>
                    <Icon source="star" size={32} color="#10b981" />
                </Animated.View>
            </Animated.View>

            {/* Subtle bottom shine */}
            <LinearGradient
                colors={['transparent', 'rgba(16, 185, 129, 0.05)']}
                style={styles.bottomGlow}
                pointerEvents="none"
            />
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
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 48,
        fontWeight: '800',
        color: '#fff',
        fontFamily: Platform.select({ ios: 'Arial Rounded MT Bold', android: 'sans-serif-rounded' }),
        letterSpacing: -1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 8,
    },
    logoIconWrapper: {
        marginBottom: 28,
        marginLeft: -4,
    },
    bottomGlow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
    }
});
