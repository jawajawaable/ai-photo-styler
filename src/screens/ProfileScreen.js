import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, RefreshControl } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabaseClient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

export default function ProfileScreen({ userId, onBack, credits, onJobPress }) {
    const [activeTab, setActiveTab] = useState('ai-profiles');
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchJobs();
        // Poll for updates every 10 seconds
        const interval = setInterval(fetchJobs, 10000);
        return () => clearInterval(interval);
    }, [userId]);

    const fetchJobs = async () => {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setJobs(data || []);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchJobs();
    };

    const getTimeRemaining = (estimatedCompletion) => {
        if (!estimatedCompletion) return 'Processing...';
        const now = new Date();
        const completion = new Date(estimatedCompletion);
        const diffMs = completion - now;

        if (diffMs <= 0) return 'Almost ready...';

        const diffMins = Math.ceil(diffMs / 60000);
        return `Ready in: ${diffMins} min`;
    };

    const renderJobCard = (job) => {
        const isCompleted = job.status === 'completed';
        const isPending = job.status === 'pending' || job.status === 'processing';
        const isFailed = job.status === 'failed';

        return (
            <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() => isCompleted && onJobPress(job)}
                disabled={!isCompleted}
            >
                {isCompleted ? (
                    <Image
                        source={{ uri: job.result_image_url }}
                        style={styles.jobImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.jobImage, styles.pendingCard]}>
                        <Icon source="loading" size={40} color="#6200ee" />
                    </View>
                )}

                <View style={styles.jobInfo}>
                    <Text style={styles.jobTitle} numberOfLines={1}>{job.style_name}</Text>
                    {isPending && (
                        <Text style={styles.jobStatus}>{getTimeRemaining(job.estimated_completion)}</Text>
                    )}
                    {isFailed && (
                        <Text style={styles.errorText} numberOfLines={2}>
                            {job.error_message || 'Failed'}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const filteredJobs = jobs.filter(job => {
        if (activeTab === 'ai-profiles') return true;
        // 'one-shot' tab would filter differently if needed
        return true;
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack}>
                    <Icon source="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Profile</Text>
                <TouchableOpacity>
                    <Icon source="cog" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'ai-profiles' && styles.activeTab]}
                    onPress={() => setActiveTab('ai-profiles')}
                >
                    <Text style={[styles.tabText, activeTab === 'ai-profiles' && styles.activeTabText]}>
                        AI Profiles
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'one-shot' && styles.activeTab]}
                    onPress={() => setActiveTab('one-shot')}
                >
                    <Text style={[styles.tabText, activeTab === 'one-shot' && styles.activeTabText]}>
                        One Shot
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Jobs Grid */}
            <ScrollView
                contentContainerStyle={styles.gridContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.grid}>
                    {filteredJobs.map(renderJobCard)}
                </View>

                {filteredJobs.length === 0 && !loading && (
                    <View style={styles.emptyState}>
                        <Icon source="image-off" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No photos yet</Text>
                        <Text style={styles.emptySubtext}>Start creating your first AI profile!</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#000',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    tabs: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#333',
    },
    tabText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
    },
    gridContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    jobCard: {
        width: CARD_WIDTH,
        marginBottom: 8,
    },
    jobImage: {
        width: '100%',
        aspectRatio: 0.75,
        borderRadius: 16,
        backgroundColor: '#1a1a1a',
    },
    pendingCard: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    jobInfo: {
        marginTop: 8,
    },
    jobTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    jobStatus: {
        color: '#888',
        fontSize: 12,
        marginTop: 2,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#888',
        fontSize: 14,
        marginTop: 8,
    },
});
