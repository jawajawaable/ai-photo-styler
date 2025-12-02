import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Surface, IconButton, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'https://ai-photo-styler-1-hozn.onrender.com';

const CREDIT_PACKAGES = [
    { id: 'mini', name: 'Mini Paket', credits: 10, price: '$0.99', color: '#3b82f6', icon: '⭐' },
    { id: 'standard', name: 'Standart Paket', credits: 50, price: '$3.99', color: '#8b5cf6', icon: '✨', popular: true },
    { id: 'premium', name: 'Premium Paket', credits: 100, price: '$6.99', color: '#ec4899', icon: '💎' },
    { id: 'ultimate', name: 'Ultimate Paket', credits: 500, price: '$24.99', color: '#f59e0b', icon: '🚀' }
];

export default function PurchaseScreen({ onBack, credits }) {
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack}>
                    <IconButton icon="arrow-left" size={24} iconColor="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kredi Al</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Current Balance */}
                <Surface style={styles.balanceCard} elevation={1}>
                    <Text style={styles.balanceLabel}>Mevcut Krediniz</Text>
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceIcon}>⭐</Text>
                        <Text style={styles.balanceAmount}>{credits || 0}</Text>
                    </View>
                </Surface>

                {/* Info */}
                <Text style={styles.infoText}>
                    Satrayni ile fotoğraflarınızı sanata dönüştürmeye devam edin! Her stil uygulaması 1 kredi harcar.
                </Text>

                {/* Packages */}
                <Text style={styles.sectionTitle}>Kredi Paketleri</Text>

                {CREDIT_PACKAGES.map((pkg) => (
                    <Surface key={pkg.id} style={styles.packageCard} elevation={2}>
                        {pkg.popular && (
                            <View style={styles.popularBadge}>
                                <Text style={styles.popularText}>POPÜLER</Text>
                            </View>
                        )}

                        <View style={styles.packageHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: pkg.color + '20' }]}>
                                <Text style={styles.packageIcon}>{pkg.icon}</Text>
                            </View>
                            <View style={styles.packageInfo}>
                                <Text style={styles.packageName}>{pkg.name}</Text>
                                <Text style={styles.packageCredits}>{pkg.credits} Kredi</Text>
                            </View>
                            <Text style={styles.packagePrice}>{pkg.price}</Text>
                        </View>

                        <Button
                            mode="contained"
                            style={[styles.buyButton, { backgroundColor: '#ccc' }]}
                            labelStyle={styles.buyButtonLabel}
                            disabled
                        >
                            Yakında Aktif
                        </Button>
                    </Surface>
                ))}

                {/* Coming Soon Message */}
                <Surface style={styles.comingSoonCard} elevation={1}>
                    <Text style={styles.comingSoonIcon}>🎉</Text>
                    <Text style={styles.comingSoonTitle}>Çok Yakında!</Text>
                    <Text style={styles.comingSoonText}>
                        Uygulama içi satın alma özelliği yakında aktif olacak. O zamana kadar admin'den kredi alabilirsiniz.
                    </Text>
                </Surface>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    content: {
        padding: 20,
    },
    balanceCard: {
        padding: 24,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    balanceLabel: {
        fontSize: 13,
        color: '#6c757d',
        marginBottom: 8,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    balanceIcon: {
        fontSize: 28,
    },
    balanceAmount: {
        fontSize: 48,
        fontWeight: '700',
        color: '#000',
    },
    infoText: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        marginBottom: 16,
    },
    packageCard: {
        padding: 20,
        borderRadius: 16,
        backgroundColor: '#fff',
        marginBottom: 12,
        position: 'relative',
        borderWidth: 1,
        borderColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    popularBadge: {
        position: 'absolute',
        top: -10,
        right: 20,
        backgroundColor: '#10b981',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    popularText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    packageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    packageIcon: {
        fontSize: 28,
    },
    packageInfo: {
        flex: 1,
    },
    packageName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    packageCredits: {
        fontSize: 14,
        color: '#6c757d',
    },
    packagePrice: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
    },
    buyButton: {
        borderRadius: 12,
        paddingVertical: 4,
    },
    buyButtonLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    comingSoonCard: {
        padding: 24,
        borderRadius: 16,
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    comingSoonIcon: {
        fontSize: 52,
        marginBottom: 12,
    },
    comingSoonTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8,
    },
    comingSoonText: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
        lineHeight: 22,
    },
});
