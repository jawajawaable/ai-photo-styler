import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Button, Divider, useTheme, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabaseClient';

export default function ProfileScreen({ userId, onBack, onAdminPress, credits, onPurchasePress }) {
    const theme = useTheme();
    const [profile, setProfile] = useState(null);
    const [email, setEmail] = useState('');

    useEffect(() => {
        fetchProfile();
        fetchEmail();
    }, []);

    const fetchProfile = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        if (data) {
            setProfile(data);
        }
    };

    const fetchEmail = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setEmail(user.email);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Button icon="arrow-left" mode="text" onPress={onBack}>
                    Geri
                </Button>
                <Text variant="headlineMedium" style={styles.title}>Profilim</Text>
                <View style={styles.creditsBadge}>
                    <Text style={styles.creditsIcon}>⭐</Text>
                    <Text style={styles.creditsValue}>{credits || 0}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Surface style={styles.card} elevation={2}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
                            <Icon source="account" size={48} color={theme.colors.primary} />
                        </View>
                    </View>

                    <Text variant="titleLarge" style={styles.emailText}>{email}</Text>

                    <Divider style={styles.divider} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Icon source="star" size={32} color="#fbbf24" />
                            <Text variant="displaySmall" style={styles.creditValue}>
                                {profile?.credits ?? '-'}
                            </Text>
                            <Text variant="bodyMedium" style={styles.infoLabel}>Kalan Kredi</Text>
                        </View>
                    </View>

                    <Button
                        mode="contained"
                        onPress={onPurchasePress}
                        style={styles.buyCreditsButton}
                        icon="plus-circle"
                    >
                        Kredi Al
                    </Button>

                    <Divider style={styles.divider} />

                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Hesap Bilgileri</Text>
                        <View style={styles.detailRow}>
                            <Text variant="bodyMedium" style={styles.detailLabel}>E-posta</Text>
                            <Text variant="bodyMedium" style={styles.detailValue}>{email}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text variant="bodyMedium" style={styles.detailLabel}>Üyelik Tipi</Text>
                            <Text variant="bodyMedium" style={styles.detailValue}>Ücretsiz</Text>
                        </View>
                    </View>
                </Surface>

                {email === 'anilerdogduu@gmail.com' && (
                    <Button
                        mode="contained"
                        onPress={onAdminPress}
                        style={styles.adminButton}
                        icon="shield-crown"
                    >
                        Admin Panel
                    </Button>
                )}

                <Button
                    mode="outlined"
                    onPress={handleLogout}
                    style={styles.logoutButton}
                    textColor={theme.colors.error}
                    icon="logout"
                >
                    Çıkış Yap
                </Button>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
        backgroundColor: '#fff',
    },
    title: {
        fontWeight: 'bold',
    },
    content: {
        padding: 16,
    },
    card: {
        borderRadius: 16,
        padding: 24,
        backgroundColor: '#fff',
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emailText: {
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: 'bold',
    },
    divider: {
        marginVertical: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 8,
    },
    infoItem: {
        alignItems: 'center',
        padding: 16,
    },
    creditValue: {
        fontWeight: 'bold',
        marginTop: 8,
        color: '#fbbf24',
    },
    infoLabel: {
        color: '#666',
        marginTop: 4,
    },
    section: {
        marginTop: 8,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    detailLabel: {
        color: '#666',
    },
    detailValue: {
        fontWeight: '500',
    },
    adminButton: {
        marginTop: 16,
    },
    logoutButton: {
        marginTop: 16,
        borderColor: '#ef4444',
    },
    creditsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    creditsIcon: {
        fontSize: 16,
        marginRight: 4,
    },
    creditsValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    buyCreditsButton: {
        marginTop: 16,
        borderRadius: 8,
    },
});
