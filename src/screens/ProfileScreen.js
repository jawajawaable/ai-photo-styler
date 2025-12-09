import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, RefreshControl, Alert, Modal, StatusBar, LayoutAnimation, Platform, UIManager, Switch } from 'react-native';
import { Text, Icon, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import AuthModal from '../components/AuthModal';

const { width } = Dimensions.get('window');
const GAP = 16;
const PADDING = 24;
const CARD_WIDTH = (width - (PADDING * 2) - GAP) / 2;

export default function ProfileScreen({ userId, onBack, credits, onJobPress }) {
    const [activeTab, setActiveTab] = useState('ai-profiles');
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const [userEmail, setUserEmail] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authInitialMode, setAuthInitialMode] = useState(true);

    const isGuest = userEmail.startsWith('guest_');

    useEffect(() => {
        if (Platform.OS === 'android') {
            if (UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true);
            }
        }

        // Fetch user email
        supabase.auth.getUser().then(({ data }) => {
            if (data?.user?.email) setUserEmail(data.user.email);
        });
    }, []);

    useEffect(() => {
        fetchJobs();
        const interval = setInterval(fetchJobs, 10000);
        return () => clearInterval(interval);
    }, [userId]);

    useEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [jobs]);

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

    const handleDeleteJob = async (jobId) => {
        Alert.alert(
            'Resmi Sil',
            'Bu resmi silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase
                            .from('jobs')
                            .delete()
                            .eq('id', jobId);

                        if (error) {
                            Alert.alert('Hata', 'Resim silinemedi: ' + error.message);
                        } else {
                            fetchJobs();
                        }
                    }
                }
            ]
        );
    };



    const handleDeleteAccount = () => {
        Alert.alert(
            'Hesabı Sil',
            'Bu işlem geri alınamaz. Hesabınızı ve tüm verilerinizi silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase.rpc('delete_own_account');

                            if (error) throw error;

                            // Sign out visually
                            await supabase.auth.signOut();
                            Alert.alert('Hesap Silindi', 'Hesabınız başarıyla silindi.');
                            // Navigation back to Auth handled by Auth State Listener in App.js usually, 
                            // or we can manually refresh if needed, but signOut triggers state change.

                        } catch (error) {
                            Alert.alert('Hata', 'Hesap silinemedi: ' + error.message);
                            console.error('Delete account error:', error);
                        }
                    }
                }
            ]
        );
    };

    const handleSupportAction = (action) => {
        Alert.alert('Bilgi', `${action} sayfası yakında eklenecek.`);
    };

    const handleLogout = async () => {
        Alert.alert(
            'Çıkış Yap',
            'Çıkış yapmak istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase.auth.signOut();
                            if (error) throw error;
                            setShowSettings(false);
                            // Optional: Force App.js update if listener misses it? 
                            // Usually not needed if listener is working.
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('Hata', 'Çıkış yapılırken bir sorun oluştu: ' + error.message);
                        }
                    }
                }
            ]
        );
    };

    const renderJobCard = (job) => {
        const isCompleted = job.status === 'completed';
        const isPending = job.status === 'pending' || job.status === 'processing';
        const isFailed = job.status === 'failed';

        return (
            <View key={job.id} style={styles.jobCard}>
                <TouchableOpacity
                    onPress={() => isCompleted && onJobPress(job)}
                    disabled={!isCompleted}
                    style={{ flex: 1 }}
                >
                    {isCompleted ? (
                        <Image
                            source={{ uri: job.result_image_url }}
                            style={styles.jobImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.jobImage, styles.pendingCard]}>
                            <ActivityIndicator color="#10b981" size={24} />
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

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteJob(job.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
                        style={styles.deleteButtonGradient}
                    >
                        <Icon source="close" size={14} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    };

    const filteredJobs = jobs.filter(job => {
        if (job.status === 'failed') return false;
        if (activeTab === 'ai-profiles') return true;
        return true;
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                        <Icon source="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Profil</Text>
                    <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.iconButton}>
                        <Icon source="cog" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'ai-profiles' && styles.activeTab]}
                        onPress={() => setActiveTab('ai-profiles')}
                    >
                        <Text style={[styles.tabText, activeTab === 'ai-profiles' && styles.activeTabText]}>
                            Profilim
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'one-shot' && styles.activeTab]}
                        onPress={() => setActiveTab('one-shot')}
                    >
                        <Text style={[styles.tabText, activeTab === 'one-shot' && styles.activeTabText]}>
                            Kayıtlı
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Jobs Grid */}
                <ScrollView
                    contentContainerStyle={styles.gridContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#10b981"
                        />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.grid}>
                        {filteredJobs.map(renderJobCard)}
                    </View>

                    {filteredJobs.length === 0 && !loading && (
                        <View style={styles.emptyState}>
                            <Icon source="image-multiple" size={48} color="#333" />
                            <Text style={styles.emptyText}>Henüz fotoğraf yok</Text>
                            <Text style={styles.emptySubtext}>İlk tasarımını oluşturmaya başla!</Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>

            {/* Settings Modal */}
            <Modal
                visible={showSettings}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSettings(false)}
            >
                <TouchableOpacity
                    style={styles.settingsModal}
                    activeOpacity={1}
                    onPress={() => setShowSettings(false)}
                >
                    <View style={styles.settingsContent}>
                        <View style={styles.settingsHeader}>
                            <Text style={styles.settingsTitle}>Ayarlar</Text>
                            <TouchableOpacity onPress={() => setShowSettings(false)} style={styles.closeButton}>
                                <Icon source="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Preferences Section */}
                            <Text style={styles.sectionTitle}>Tercihler</Text>
                            <View style={styles.settingsSection}>
                                <View style={styles.settingsItem}>
                                    <View style={styles.settingsItemLeft}>
                                        <Icon source="bell-outline" size={24} color="#fff" />
                                        <Text style={styles.settingsItemText}>Bildirimler</Text>
                                    </View>
                                    <Switch
                                        value={notificationsEnabled}
                                        onValueChange={setNotificationsEnabled}
                                        trackColor={{ false: '#333', true: '#10b981' }}
                                        thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
                                    />
                                </View>
                            </View>

                            {/* Support Section */}
                            <Text style={styles.sectionTitle}>Destek</Text>
                            <View style={styles.settingsSection}>
                                <TouchableOpacity style={styles.settingsItem} onPress={() => handleSupportAction('Yardım & Destek')}>
                                    <View style={styles.settingsItemLeft}>
                                        <Icon source="help-circle-outline" size={24} color="#fff" />
                                        <Text style={styles.settingsItemText}>Yardım & Destek</Text>
                                    </View>
                                    <Icon source="chevron-right" size={24} color="#666" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.settingsItem} onPress={() => handleSupportAction('Gizlilik Politikası')}>
                                    <View style={styles.settingsItemLeft}>
                                        <Icon source="shield-outline" size={24} color="#fff" />
                                        <Text style={styles.settingsItemText}>Gizlilik Politikası</Text>
                                    </View>
                                    <Icon source="chevron-right" size={24} color="#666" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.settingsItem} onPress={() => handleSupportAction('Kullanım Koşulları')}>
                                    <View style={styles.settingsItemLeft}>
                                        <Icon source="file-document-outline" size={24} color="#fff" />
                                        <Text style={styles.settingsItemText}>Kullanım Koşulları</Text>
                                    </View>
                                    <Icon source="chevron-right" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            {/* Account Section */}
                            <Text style={styles.sectionTitle}>Hesap</Text>
                            <View style={styles.settingsSection}>
                                <TouchableOpacity style={styles.settingsItem} onPress={async () => {
                                    await Clipboard.setStringAsync(userId);
                                    Alert.alert('Kopyalandı', 'Kullanıcı ID panoya kopyalandı.');
                                }}>
                                    <View style={styles.settingsItemLeft}>
                                        <Icon source="account-key-outline" size={24} color="#888" />
                                        <View>
                                            <Text style={styles.settingsItemText}>Kullanıcı ID (Kopyala)</Text>
                                            <Text style={{ color: '#666', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 }}>{userId}</Text>
                                        </View>
                                    </View>
                                    <Icon source="content-copy" size={20} color="#666" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.settingsItem} onPress={handleLogout}>
                                    <View style={styles.settingsItemLeft}>
                                        <Icon source="logout" size={24} color="#ef4444" />
                                        <Text style={styles.settingsItemTextDanger}>Çıkış Yap</Text>
                                    </View>
                                </TouchableOpacity>

                                {isGuest && (
                                    <>
                                        <TouchableOpacity style={styles.settingsItem} onPress={() => {
                                            setAuthInitialMode(false);
                                            setShowAuthModal(true);
                                        }}>
                                            <View style={styles.settingsItemLeft}>
                                                <Icon source="account-plus-outline" size={24} color="#10b981" />
                                                <Text style={[styles.settingsItemText, { color: '#10b981' }]}>Hesabı Kaydet</Text>
                                            </View>
                                            <Icon source="chevron-right" size={24} color="#10b981" />
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.settingsItem} onPress={() => {
                                            setAuthInitialMode(true);
                                            setShowAuthModal(true);
                                        }}>
                                            <View style={styles.settingsItemLeft}>
                                                <Icon source="login" size={24} color="#fff" />
                                                <Text style={styles.settingsItemText}>Üye Girişi</Text>
                                            </View>
                                            <Icon source="chevron-right" size={24} color="#666" />
                                        </TouchableOpacity>
                                    </>
                                )}

                                <TouchableOpacity style={styles.settingsItem} onPress={handleDeleteAccount}>
                                    <View style={styles.settingsItemLeft}>
                                        <Icon source="delete-outline" size={24} color="#ef4444" />
                                        <Text style={styles.settingsItemTextDanger}>Hesabı Sil</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.versionFooter}>
                                <Text style={styles.versionText}>Versiyon 1.0.0</Text>
                            </View>
                        </ScrollView>
                    </View>
                </TouchableOpacity >
            </Modal >

            <AuthModal
                visible={showAuthModal}
                initialMode={authInitialMode}
                onClose={() => setShowAuthModal(false)}
                onLoginSuccess={() => {
                    // Refresh email provided by modal or just re-fetch
                    supabase.auth.getUser().then(({ data }) => {
                        if (data?.user?.email) setUserEmail(data.user.email);
                    });
                }}
            />
        </View >
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
    },
    iconButton: {
        padding: 4,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingBottom: 24,
        gap: 12,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 100,
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
    },
    activeTab: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
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
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 16,
    },
    jobCard: {
        width: CARD_WIDTH,
        marginBottom: 8,
    },
    jobImage: {
        width: '100%',
        height: CARD_WIDTH * 1.4, // Aspect ratio tailored
        borderRadius: 16,
        backgroundColor: '#1a1a1a',
    },
    pendingCard: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    jobInfo: {
        marginTop: 12,
        paddingHorizontal: 4,
    },
    jobTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    jobStatus: {
        color: '#10b981',
        fontSize: 12,
        fontWeight: '600',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#666',
        fontSize: 14,
        marginTop: 8,
    },
    deleteButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        borderRadius: 100,
        overflow: 'hidden',
    },
    deleteButtonGradient: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    settingsContent: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 48,
    },
    settingsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    settingsTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    settingsItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    settingsItemText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    settingsItemTextDanger: {
        fontSize: 16,
        color: '#ef4444',
        fontWeight: '600',
    },
    sectionTitle: {
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 24,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    settingsSection: {
        backgroundColor: '#262626',
        borderRadius: 16,
        paddingHorizontal: 16,
        overflow: 'hidden',
    },
    closeButton: {
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    versionFooter: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    versionText: {
        color: '#444',
        fontSize: 12,
    },
});
