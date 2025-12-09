import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions, FlatList } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabaseClient';
import StyleCard from '../components/StyleCard';

// CATEGORIES removed - fetched dynamically

const CategoryScreen = ({ onSelectCategory, onStylePress }) => {
    const [groupedStyles, setGroupedStyles] = useState({});
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchAndGroupStyles();
    }, []);

    const fetchAndGroupStyles = async () => {
        try {
            const [stylesResult, categoriesResult] = await Promise.all([
                supabase.from('styles').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
                supabase.from('categories').select('*').order('sort_order', { ascending: true })
            ]);

            if (stylesResult.error) throw stylesResult.error;
            if (categoriesResult.error) throw categoriesResult.error;

            const stylesData = stylesResult.data || [];
            const categoriesData = categoriesResult.data || [];

            setCategories(categoriesData);

            const groups = {};
            // Initialize groups from fetched categories
            categoriesData.forEach(cat => groups[cat.id] = []);

            stylesData.forEach(style => {
                const catId = style.category || getCategoryFallback(style.style_id);
                if (groups[catId]) {
                    groups[catId].push(style);
                }
            });

            setGroupedStyles(groups);
        } catch (error) {
            console.error('Error fetching styles:', error);
        }
    };

    const getCategoryFallback = (id) => {
        if (['vesikalik'].includes(id)) return 'Profesyonel';
        if (['bulut', 'gryffindor'].includes(id)) return 'Fantastik';
        if (['osmanli', 'devrimci', 'arabesk'].includes(id)) return 'Nostaljik';
        if (['anime'].includes(id)) return 'Sanatsal';
        return 'Yaratıcı';
    };

    const handleStylePress = (style) => {
        if (onStylePress) {
            onStylePress(style);
        } else {
            console.warn('onStylePress not provided to CategoryScreen');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Stiller</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {categories.map((category) => {
                        const styles = groupedStyles[category.id] || [];
                        if (styles.length === 0) return null;

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
                                    {styles.map((style) => (
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
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

export default CategoryScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -1,
    },
    scrollContent: {
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
        marginRight: 0, // Gap handled by parent
    }
});
