import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const ONBOARDING_KEY = '@satrayni_onboarding_complete';

const pages = [
    {
        title: 'Satrayni\'ye Hoş Geldin',
        description: 'Fotoğraflarını yapay zeka gücüyle sanata dönüştür',
        emoji: '🎨',
        color: '#6366f1'
    },
    {
        title: 'Birçok Stil Seç',
        description: 'Vesikalık\'tan anime\'ye, düğün fotoğrafından devrimci postere kadar onlarca stil',
        emoji: '✨',
        color: '#ec4899'
    },
    {
        title: 'Hemen Başla',
        description: 'Fotoğrafını yükle, stilini seç ve sanata dönüşmesini izle!',
        emoji: '🚀',
        color: '#10b981'
    }
];

export default function OnboardingScreen({ onComplete }) {
    const [currentPage, setCurrentPage] = useState(0);
    const scrollViewRef = useRef(null);

    const handleNext = () => {
        if (currentPage < pages.length - 1) {
            const nextPage = currentPage + 1;
            scrollViewRef.current?.scrollTo({ x: width * nextPage, animated: true });
            setCurrentPage(nextPage);
        }
    };

    const handleGetStarted = async () => {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        onComplete();
    };

    const handleScroll = (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const page = Math.round(offsetX / width);
        setCurrentPage(page);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {pages.map((page, index) => (
                    <View key={index} style={styles.page}>
                        <View style={styles.content}>
                            <View style={[styles.emojiContainer, { backgroundColor: page.color + '20' }]}>
                                <Text style={styles.emoji}>{page.emoji}</Text>
                            </View>
                            <Text style={styles.title}>{page.title}</Text>
                            <Text style={styles.description}>{page.description}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {pages.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            currentPage === index && styles.activeDot,
                            { backgroundColor: currentPage === index ? pages[currentPage].color : '#ddd' }
                        ]}
                    />
                ))}
            </View>

            {/* Bottom Buttons */}
            <View style={styles.footer}>
                {currentPage < pages.length - 1 ? (
                    <View style={styles.buttonRow}>
                        <TouchableOpacity onPress={handleGetStarted}>
                            <Text style={styles.skipText}>Atla</Text>
                        </TouchableOpacity>
                        <Button
                            mode="contained"
                            onPress={handleNext}
                            style={[styles.nextButton, { backgroundColor: pages[currentPage].color }]}
                            labelStyle={styles.buttonLabel}
                        >
                            Devam
                        </Button>
                    </View>
                ) : (
                    <Button
                        mode="contained"
                        onPress={handleGetStarted}
                        style={[styles.startButton, { backgroundColor: pages[currentPage].color }]}
                        labelStyle={styles.buttonLabel}
                    >
                        Başla
                    </Button>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    page: {
        width: width,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 100,
    },
    emojiContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    emoji: {
        fontSize: 80,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    activeDot: {
        width: 24,
        height: 8,
        borderRadius: 4,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skipText: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500',
    },
    nextButton: {
        borderRadius: 12,
        paddingVertical: 4,
    },
    startButton: {
        borderRadius: 12,
        paddingVertical: 8,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
});
