import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar, Dimensions } from 'react-native';
import { Text, Icon, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../services/supabaseClient';
import StyleCard from '../components/StyleCard';
import { LinearGradient } from 'expo-linear-gradient';

export default function CategoryDetailScreen({ category, onBack, onStyleSelected }) {
    const insets = useSafeAreaInsets();
    const [stylesData, setStylesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryTitle, setCategoryTitle] = useState(category);

    useEffect(() => {
        fetchStylesByCategory();
    }, [category]);

    const fetchStylesByCategory = async () => {
        try {
            setLoading(true);

            // Fetch Category Title if possible
            if (category !== 'Yeni Eklenenler' && category !== 'New Arrivals') {
                const { data: catData } = await supabase
                    .from('categories')
                    .select('title')
                    .eq('id', category)
                    .single();
                
                if (catData?.title) {
                    setCategoryTitle(catData.title);
                } else {
                    setCategoryTitle(category);
                }
            } else {
                setCategoryTitle('Yeni Eklenenler');
            }

            // Fetch all active styles
            let { data, error } = await supabase
                .from('styles')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;
            
            let filteredData = data || [];

            if (category === 'Yeni Eklenenler') {
                // Client-side sort for New Arrivals
                filteredData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            } else {
                // Client-side filter for specific categories
                // Use the same fallback logic as HomeScreen/CategoryScreen
                filteredData = filteredData.filter(style => {
                    const styleCat = style.category || getCategoryFallback(style.style_id);
                    return styleCat === category;
                });
                // Sort by order
                filteredData.sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));
            }

            setStylesData(filteredData);
        } catch (error) {
            console.error('Error fetching filtered styles:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryFallback = (id) => {
        if (['vesikalik'].includes(id)) return 'Profesyonel';
        if (['bulut', 'gryffindor'].includes(id)) return 'Fantastik';
        if (['osmanli', 'devrimci', 'arabesk'].includes(id)) return 'Nostaljik';
        if (['anime'].includes(id)) return 'Sanatsal';
        return 'Yaratıcı';
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                        <Icon source="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{categoryTitle} Stiller</Text>
                    <View style={{ width: 40 }} />
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#10b981" size="large" />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {stylesData.length > 0 ? (
                            <View style={styles.gridContainer}>
                                {stylesData.map((style) => (
                                    <View key={style.id} style={styles.gridItem}>
                                        <StyleCard
                                            style={style}
                                            size="medium"
                                            onPress={onStyleSelected}
                                        />
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Icon source="image-search-outline" size={48} color="#333" />
                                <Text style={styles.emptyText}>Bu kategoride henüz stil yok.</Text>
                            </View>
                        )}
                    </ScrollView>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    iconButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 40,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
    },
    gridItem: {
        width: '50%',
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        gap: 16,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    }
});
