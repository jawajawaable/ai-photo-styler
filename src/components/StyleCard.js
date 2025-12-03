import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, Surface } from 'react-native-paper';

export default function StyleCard({ style, onPress, size = 'medium' }) {
    const isLarge = size === 'large';
    const height = isLarge ? 280 : 200;
    const width = isLarge ? 200 : 140;

    return (
        <TouchableOpacity onPress={() => onPress(style)} activeOpacity={0.9}>
            <Surface style={[styles.card, { width, height }]} elevation={2}>
                <Image
                    source={{ uri: style.image_url || 'https://via.placeholder.com/200' }}
                    style={styles.image}
                    resizeMode="cover"
                />
                <View style={styles.overlay}>
                    <Text variant="titleMedium" style={styles.title} numberOfLines={2}>
                        {style.name}
                    </Text>
                    {style.is_new && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>YENİ</Text>
                        </View>
                    )}
                </View>
            </Surface>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        overflow: 'hidden',
        marginRight: 12,
        backgroundColor: '#1a1a1a',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        paddingTop: 40, // Fade start
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)', // Simple dimming for readability
    },
    title: {
        color: '#fff',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    badge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#E91E63',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    }
});
