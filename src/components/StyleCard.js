import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function StyleCard({ style, onPress, size = 'medium' }) {
    let cardWidth;
    if (size === 'large') {
        cardWidth = width * 0.7;
    } else if (size === 'horizontal') {
        cardWidth = 140; // Fixed width for horizontal lists
    } else {
        cardWidth = (width - 48) / 2; // Default grid
    }
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            delay: Math.random() * 300, // Random staggered delay
        }).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
            <TouchableOpacity
                onPress={() => onPress(style)}
                activeOpacity={0.85}
                style={[styles.container, { width: cardWidth }]}
            >
                <View style={styles.card}>
                    <Image
                        source={{ uri: style.image_url }}
                        style={styles.image}
                        resizeMode="cover"
                    />

                    {/* Glassy Gradient Overlay */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
                        locations={[0, 0.5, 1]}
                        style={styles.overlay}
                    >
                        <View style={styles.textContainer}>
                            <Text style={styles.name} numberOfLines={1}>
                                {style.name}
                            </Text>
                            {style.is_new && (
                                <View style={styles.newBadge}>
                                    <Text style={styles.newText}>YENİ</Text>
                                </View>
                            )}
                        </View>
                    </LinearGradient>

                    {/* Subtle Border Glow */}
                    <View style={styles.borderOverlay} pointerEvents="none" />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        shadowColor: '#10b981', // Emerald shadow
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        position: 'relative',
    },
    image: {
        width: '100%',
        aspectRatio: 0.7, // Taller, more cinematic aspect ratio
        backgroundColor: '#1a1a1a',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingTop: 60,
        justifyContent: 'flex-end',
    },
    textContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    name: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        flex: 1,
    },
    newBadge: {
        backgroundColor: '#10b981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    newText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    borderOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        zIndex: 10,
    }
});
