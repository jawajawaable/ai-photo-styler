
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import PurchaseService from '../services/purchaseService';
import { supabase } from '../services/supabaseClient';
import * as Clipboard from 'expo-clipboard';

export default function PurchaseScreen({ onBack, credits, onPurchaseSuccess }) {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        const pkgList = await PurchaseService.getPackages();
        setPackages(pkgList);
        setLoading(false);
    };

    const handlePurchase = async (pkg) => {
        setPurchasing(true);
        const { success, error } = await PurchaseService.purchasePackage(pkg);

        if (success) {
            // Fetch User ID for safety alert
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'Bilinmiyor';

            Alert.alert(
                'İşlem Başarılı ✅',
                `Kredileriniz yüklendi!\n\nÖNEMLİ: Uygulamayı silerseniz veya cihaz değiştirirseniz hesabınızı kurtarmak için şu ID'ye ihtiyacınız olacak:\n\n${userId}\n\nLütfen bunu saklayın!`,
                [
                    { text: 'Tamam', style: 'cancel' },
                    {
                        text: 'ID\'yi Kopyala',
                        onPress: async () => {
                            await Clipboard.setStringAsync(userId);
                            Alert.alert('Kopyalandı', 'Kullanıcı ID panoya kopyalandı. Lütfen not defterinize yapıştırın.');
                        }
                    }
                ]
            );
            if (onPurchaseSuccess) onPurchaseSuccess();
        }
        setPurchasing(false);
    };

    // Fallback/Mock Data if no revenuecat keys or no internet
    // This ensures UI doesn't look broken during development
    const DISPLAY_PACKAGES = packages.length > 0 ? packages.map(p => ({
        id: p.identifier,
        name: p.product.title,
        credits: p.product.description ? parseInt(p.product.description.replace(/\D/g, '')) || 10 : 10, // Try parse from desc
        price: p.product.priceString,
        color: '#10b981',
        icon: 'star',
        originalPackage: p
    })) : [
        { id: 'mini', name: 'Mini Paket', credits: 10, price: '$0.99', color: '#3b82f6', icon: 'star', popular: false },
        { id: 'standard', name: 'Standart Paket', credits: 50, price: '$3.99', color: '#10b981', icon: 'star-four-points', popular: true },
        { id: 'premium', name: 'Premium Paket', credits: 100, price: '$6.99', color: '#ec4899', icon: 'diamond', popular: false },
        { id: 'ultimate', name: 'Ultimate Paket', credits: 500, price: '$24.99', color: '#f59e0b', icon: 'rocket', popular: false }
    ];

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Icon source="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mağaza</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Loading Overlay */}
                {purchasing && (
                    <View style={styles.loadingOverlay}>
                        <View style={styles.loadingCard}>
                            <ActivityIndicator size="large" color="#10b981" />
                            <Text style={styles.loadingText}>İşlem yapılıyor...</Text>
                        </View>
                    </View>
                )}

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Current Balance */}
                    <LinearGradient
                        colors={['#1a1a1a', '#101010']}
                        style={styles.balanceCard}
                    >
                        <Text style={styles.balanceLabel}>MEVCUT KREDİNİZ</Text>
                        <View style={styles.balanceRow}>
                            <Text style={styles.balanceAmount}>{credits || 0}</Text>
                            <View style={styles.balanceIconContainer}>
                                <Icon source="star-four-points" size={24} color="#10b981" />
                            </View>
                        </View>
                        <Text style={styles.balanceSubtext}>
                            Her stil uygulaması = 1 Kredi
                        </Text>
                    </LinearGradient>

                    {/* Packages */}
                    <Text style={styles.sectionTitle}>Paketler</Text>

                    {loading ? (
                        <ActivityIndicator color="#10b981" style={{ marginTop: 20 }} />
                    ) : (
                        DISPLAY_PACKAGES.map((pkg, index) => (
                            <TouchableOpacity
                                key={pkg.id}
                                activeOpacity={0.9}
                                style={styles.packageWrapper}
                                onPress={() => pkg.originalPackage ? handlePurchase(pkg.originalPackage) : Alert.alert('Demo Modu', 'RevenueCat yapılandırması eksik.')}
                            >
                                <LinearGradient
                                    colors={['#18181b', '#000']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.packageCard}
                                >
                                    {pkg.popular && (
                                        <LinearGradient
                                            colors={['#10b981', '#059669']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.popularBadge}
                                        >
                                            <Text style={styles.popularText}>EN POPÜLER</Text>
                                        </LinearGradient>
                                    )}

                                    <View style={styles.packageContent}>
                                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                                            <Icon source={pkg.icon || 'star'} size={28} color={pkg.color || '#fff'} />
                                        </View>

                                        <View style={styles.packageInfo}>
                                            <Text style={styles.packageName}>{pkg.name}</Text>
                                            <Text style={styles.packageCredits}>
                                                <Text style={styles.creditCount}>{pkg.credits}</Text> Kredi
                                            </Text>
                                        </View>

                                        <View style={styles.priceContainer}>
                                            <Text style={styles.packagePrice}>{pkg.price}</Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    balanceCard: {
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#333',
    },
    balanceLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 12,
        letterSpacing: 1.5,
        fontWeight: '700',
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 56,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -2,
    },
    balanceIconContainer: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        padding: 8,
        borderRadius: 12,
    },
    balanceSubtext: {
        color: '#888',
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 16,
        marginLeft: 4,
    },
    packageWrapper: {
        marginBottom: 16,
    },
    packageCard: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#222',
        position: 'relative',
        overflow: 'hidden',
    },
    packageContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    popularBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderBottomLeftRadius: 12,
    },
    popularText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '800',
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    packageInfo: {
        flex: 1,
    },
    packageName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    packageCredits: {
        fontSize: 14,
        color: '#666',
    },
    creditCount: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    priceContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    packagePrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    comingSoonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        backgroundColor: '#111',
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#222',
        gap: 16,
    },
    comingSoonInfo: {
        flex: 1,
    },
    comingSoonTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    comingSoonText: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingCard: {
        backgroundColor: '#1a1a1a',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
