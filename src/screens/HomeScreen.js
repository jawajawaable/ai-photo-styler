import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, FlatList, Dimensions, Image, StatusBar, Animated, Easing, Platform } from 'react-native';
import { Text, useTheme, ActivityIndicator, Icon } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../services/supabaseClient';
import StyleCard from '../components/StyleCard';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CAROUSEL_ITEM_WIDTH = width;

// CATEGORIES removed - fetched dynamically

export default function HomeScreen({ onStyleSelected, credits, onPurchasePress, onSelectCategory }) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const [categories, setCategories] = useState([]);
    const [stylesData, setStylesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
    const carouselRef = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [stylesResult, categoriesResult] = await Promise.all([
                supabase.from('styles').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
                supabase.from('categories').select('*').order('sort_order', { ascending: true })
            ]);

            if (stylesResult.error) throw stylesResult.error;
            if (categoriesResult.error) throw categoriesResult.error;

            setStylesData(stylesResult.data || []);
            setCategories(categoriesResult.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getCategoryFallback = (id) => {
        if (['vesikalik'].includes(id)) return 'Profesyonel';
        if (['bulut', 'gryffindor'].includes(id)) return 'Fantastik';
        if (['osmanli', 'devrimci', 'arabesk'].includes(id)) return 'Nostaljik';
        if (['anime'].includes(id)) return 'Sanatsal';
        return 'Yaratıcı';
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleStylePress = (style) => {
        onStyleSelected(style);
    };

    const featuredStyles = stylesData.filter(s => s.featured_in_carousel).slice(0, 8);

    const groupedStyles = {};
    categories.forEach(cat => groupedStyles[cat.id] = []);

    stylesData.forEach(style => {
        const catId = style.category || getCategoryFallback(style.style_id);
        // Only add if category exists (or handle 'Other' if needed, but for now strict)
        if (groupedStyles[catId]) {
            groupedStyles[catId].push(style);
        }
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient
                colors={['#000000', '#0a0a0a', '#1a1a1a']}
                style={StyleSheet.absoluteFill}
            />

            {/* Immersive Header Overlay */}
            <View style={[styles.headerOverlay, { paddingTop: insets.top + 10 }]}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                />
                <View style={styles.headerContent}>
                    {/* Logo Section */}
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>Satrik</Text>
                        <View style={styles.logoIconWrapper}>
                            <Icon source="star" size={20} color="#10b981" />
                        </View>
                    </View>

                    <TouchableOpacity onPress={onPurchasePress} style={styles.creditsButton}>
                        <View style={styles.creditsPill}>
                            <Text style={styles.creditsValue}>{credits || 0}</Text>
                            <View style={styles.creditsDot} />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 0, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#10b981"
                        progressViewOffset={insets.top + 60}
                    />
                }
            >
                {!loading && featuredStyles.length > 0 && (
                    <View style={styles.carouselSection}>
                        <FlatList
                            ref={carouselRef}
                            data={featuredStyles}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={CAROUSEL_ITEM_WIDTH}
                            snapToAlignment="start"
                            decelerationRate="fast"
                            onScroll={(event) => {
                                const slideIndex = Math.round(
                                    event.nativeEvent.contentOffset.x / CAROUSEL_ITEM_WIDTH
                                );
                                setActiveCarouselIndex(slideIndex);
                            }}
                            scrollEventThrottle={16}
                            keyExtractor={(item) => `carousel-${item.id}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    activeOpacity={1}
                                    onPress={() => handleStylePress(item)}
                                    style={styles.carouselItem}
                                >
                                    <View style={styles.carouselCard}>
                                        <Image
                                            source={{ uri: item.image_url }}
                                            style={styles.carouselImage}
                                            resizeMode="cover"
                                        />

                                        <LinearGradient
                                            colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
                                            locations={[0, 0.6, 1]}
                                            style={styles.carouselGradient}
                                        >
                                            <View style={styles.carouselInfo}>
                                                <Text style={styles.carouselTitle}>{item.name}</Text>
                                                <Text style={styles.carouselSubtitle} numberOfLines={2}>
                                                    {item.short_description}
                                                </Text>

                                                <TouchableOpacity
                                                    activeOpacity={0.9}
                                                    onPress={() => handleStylePress(item)}
                                                >
                                                    <Animated.View style={[styles.tryButton, { transform: [{ scale: pulseAnim }] }]}>
                                                        <LinearGradient
                                                            colors={['#10b981', '#059669']}
                                                            start={{ x: 0, y: 0 }}
                                                            end={{ x: 1, y: 0 }}
                                                            style={styles.tryGradient}
                                                        >
                                                            <Text style={styles.tryText}>Şimdi Dene</Text>
                                                        </LinearGradient>
                                                    </Animated.View>
                                                </TouchableOpacity>
                                            </View>
                                        </LinearGradient>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />

                        <View style={styles.dotsContainer}>
                            {featuredStyles.map((_, index) => (
                                <View
                                    key={`dot-${index}`}
                                    style={[
                                        styles.dot,
                                        index === activeCarouselIndex && styles.activeDot
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {loading ? (
                    <View style={[styles.loadingContainer, { marginTop: insets.top + 50 }]}>
                        <ActivityIndicator color="#10b981" size="large" />
                    </View>
                ) : (
                    <View style={styles.contentSection}>


                        {/* Categories Sections */}
                        {categories.map((category) => {
                            const categoryStyles = groupedStyles[category.id] || [];
                            if (categoryStyles.length === 0) return null;

                            return (
                                <View key={category.id} style={styles.sectionContainer}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>{category.title}</Text>
                                        <TouchableOpacity onPress={() => onSelectCategory(category.id)}>
                                            <Text style={styles.seeAllText}>Hepsini Gör</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.horizontalList}
                                    >
                                        {categoryStyles.map((style) => (
                                            <View key={style.id} style={styles.cardWrapper}>
                                                <StyleCard
                                                    style={style}
                                                    size="horizontal"
                                                    onPress={handleStylePress}
                                                />
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 51,
    },
    creditsButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    creditsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    creditsValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        fontFamily: Platform.select({ ios: 'Arial Rounded MT Bold', android: 'sans-serif-rounded' }),
        letterSpacing: -0.5,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
    },
    logoIconWrapper: {
        marginBottom: 20,
        marginLeft: -4,
        transform: [{ rotate: '15deg' }]
    },
    creditsDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10b981',
    },
    carouselSection: {
        marginBottom: 32,
    },
    carouselItem: {
        width: CAROUSEL_ITEM_WIDTH,
    },
    carouselCard: {
        height: 520,
        position: 'relative',
    },
    carouselImage: {
        width: '100%',
        height: '100%',
    },
    carouselGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 120,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    carouselInfo: {
        gap: 8,
        paddingBottom: 8,
    },
    carouselTitle: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        lineHeight: 40,
        marginBottom: 4,
    },
    carouselSubtitle: {
        fontSize: 15,
        color: '#e2e8f0',
        lineHeight: 22,
        fontWeight: '500',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        maxWidth: '90%',
    },
    tryButton: {
        alignSelf: 'flex-start',
        borderRadius: 100,
        overflow: 'hidden',
        marginTop: 12,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    tryGradient: {
        paddingHorizontal: 32,
        paddingVertical: 16,
    },
    tryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        gap: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    activeDot: {
        width: 32,
        backgroundColor: '#10b981',
    },
    loadingContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentSection: {
        paddingBottom: 40,
    },
    sectionContainer: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    seeAllText: {
        fontSize: 14,
        color: '#888',
        fontWeight: '600',
    },
    horizontalList: {
        paddingHorizontal: 24,
        gap: 16,
    },
    cardWrapper: {
        marginRight: 0,
    }
});
