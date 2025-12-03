import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { Text, Icon, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabaseClient';
import StyleCard from '../components/StyleCard';
import * as ImagePicker from 'expo-image-picker';

export default function HomeScreen({ onStyleSelected, credits, onProfilePress }) {
    const theme = useTheme();
    const [styles, setStyles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchStyles();
    }, []);

    const fetchStyles = async () => {
        try {
            const { data, error } = await supabase
                .from('styles')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            setStyles(data || []);
        } catch (error) {
            console.error('Error fetching styles:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchStyles();
    };

    const handleStylePress = (style) => {
        onStyleSelected(style);
    };

    const renderSection = (title, data, size = 'medium') => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text variant="titleLarge" style={styles.sectionTitle}>{title}</Text>
                <TouchableOpacity>
                    <Text variant="bodyMedium" style={styles.seeAll}>Tümünü Gör</Text>
                </TouchableOpacity>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {data.map((style) => (
                    <StyleCard
                        key={style.id}
                        style={style}
                        size={size}
                        onPress={handleStylePress}
                    />
                ))}
            </ScrollView>
        </View>
    );

    // Group styles for demo purposes (in real app, use categories)
    const popularStyles = styles.slice(0, 3);
    const newStyles = styles.slice(3, 6);
    const allStyles = styles;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.logo}>SATRAYNI</Text>
                <View style={styles.headerRight}>
                    <View style={styles.proBadge}>
                        <Text style={styles.proText}>PRO</Text>
                    </View>
                    <TouchableOpacity onPress={onProfilePress} style={styles.profileButton}>
                        <Icon source="account-circle" size={28} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={theme.colors.primary} size="large" />
                    </View>
                ) : (
                    <>
                        {renderSection('Popüler', popularStyles, 'large')}
                        {renderSection('Yeni Eklenenler', newStyles, 'medium')}
                        {renderSection('Tüm Stiller', allStyles, 'medium')}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    logo: {
        fontWeight: '900',
        color: '#000',
        letterSpacing: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    proBadge: {
        backgroundColor: '#6200ee',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    proText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    content: {
        paddingBottom: 100, // Space for bottom nav
    },
    loadingContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#000',
        fontWeight: 'bold',
    },
    seeAll: {
        color: '#666',
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
});
