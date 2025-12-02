import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, TextInput, Surface, IconButton, Switch, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'https://ai-photo-styler-1-hozn.onrender.com';

export default function AdminScreen({ userId, onBack, credits }) {
    const theme = useTheme();
    const [styles, setStyles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [newStyle, setNewStyle] = useState({
        style_id: '',
        name: '',
        description: '',
        prompt_modifier: '',
        icon: '',
        color: '#000000',
        is_active: true,
        sort_order: 0
    });

    useEffect(() => {
        fetchStyles();
    }, []);

    const fetchStyles = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/styles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const data = await response.json();
            if (response.ok) {
                setStyles(data.styles);
            } else {
                Alert.alert('Hata', data.error);
            }
        } catch (error) {
            Alert.alert('Hata', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newStyle.style_id || !newStyle.name || !newStyle.prompt_modifier) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/styles/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, style: newStyle })
            });
            const data = await response.json();
            if (response.ok) {
                Alert.alert('Başarılı', 'Stil eklendi');
                setNewStyle({
                    style_id: '',
                    name: '',
                    description: '',
                    prompt_modifier: '',
                    icon: '',
                    color: '#000000',
                    is_active: true,
                    sort_order: 0
                });
                fetchStyles();
            } else {
                Alert.alert('Hata', data.error);
            }
        } catch (error) {
            Alert.alert('Hata', error.message);
        }
    };

    const handleToggleActive = async (styleId, currentStatus) => {
        try {
            const response = await fetch(`${API_URL}/api/admin/styles/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    styleId,
                    updates: { is_active: !currentStatus }
                })
            });
            if (response.ok) {
                fetchStyles();
            }
        } catch (error) {
            Alert.alert('Hata', error.message);
        }
    };

    const handleDelete = async (styleId) => {
        Alert.alert(
            'Emin misiniz?',
            'Bu stili silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`${API_URL}/api/admin/styles/delete`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId, styleId })
                            });
                            if (response.ok) {
                                Alert.alert('Başarılı', 'Stil silindi');
                                fetchStyles();
                            }
                        } catch (error) {
                            Alert.alert('Hata', error.message);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Button icon="arrow-left" mode="text" onPress={onBack}>
                    Geri
                </Button>
                <Text variant="headlineMedium" style={styles.title}>Admin Panel</Text>
                <View style={styles.creditsBadge}>
                    <Text style={styles.creditsIcon}>⭐</Text>
                    <Text style={styles.creditsValue}>{credits || 0}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Surface style={styles.card} elevation={2}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>Yeni Stil Ekle</Text>

                    <TextInput
                        label="Stil ID (örn: cyberpunk)"
                        value={newStyle.style_id}
                        onChangeText={(text) => setNewStyle({ ...newStyle, style_id: text })}
                        mode="outlined"
                        style={styles.input}
                    />

                    <TextInput
                        label="İsim"
                        value={newStyle.name}
                        onChangeText={(text) => setNewStyle({ ...newStyle, name: text })}
                        mode="outlined"
                        style={styles.input}
                    />

                    <TextInput
                        label="Açıklama"
                        value={newStyle.description}
                        onChangeText={(text) => setNewStyle({ ...newStyle, description: text })}
                        mode="outlined"
                        multiline
                        numberOfLines={2}
                        style={styles.input}
                    />

                    <TextInput
                        label="Prompt"
                        value={newStyle.prompt_modifier}
                        onChangeText={(text) => setNewStyle({ ...newStyle, prompt_modifier: text })}
                        mode="outlined"
                        multiline
                        numberOfLines={4}
                        style={styles.input}
                    />

                    <TextInput
                        label="İkon (emoji)"
                        value={newStyle.icon}
                        onChangeText={(text) => setNewStyle({ ...newStyle, icon: text })}
                        mode="outlined"
                        style={styles.input}
                    />

                    <TextInput
                        label="Renk (hex)"
                        value={newStyle.color}
                        onChangeText={(text) => setNewStyle({ ...newStyle, color: text })}
                        mode="outlined"
                        style={styles.input}
                    />

                    <Button mode="contained" onPress={handleCreate} style={styles.addButton}>
                        Stil Ekle
                    </Button>
                </Surface>

                <Text variant="titleLarge" style={styles.listTitle}>Mevcut Stiller ({styles.length})</Text>

                {styles.map((style) => (
                    <Surface key={style.id} style={styles.styleCard} elevation={1}>
                        <View style={styles.styleHeader}>
                            <View style={styles.styleInfo}>
                                <Text variant="titleMedium">{style.icon} {style.name}</Text>
                                <Text variant="bodySmall" style={styles.styleId}>{style.style_id}</Text>
                            </View>
                            <View style={styles.styleActions}>
                                <Switch
                                    value={style.is_active}
                                    onValueChange={() => handleToggleActive(style.id, style.is_active)}
                                />
                                <IconButton
                                    icon="delete"
                                    iconColor={theme.colors.error}
                                    onPress={() => handleDelete(style.id)}
                                />
                            </View>
                        </View>
                        <Text variant="bodySmall" numberOfLines={2}>{style.description}</Text>
                    </Surface>
                ))}
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
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 16,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 12,
    },
    input: {
        marginBottom: 12,
    },
    addButton: {
        marginTop: 8,
    },
    listTitle: {
        fontWeight: 'bold',
        marginBottom: 12,
        marginTop: 8,
    },
    styleCard: {
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    styleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    styleInfo: {
        flex: 1,
    },
    styleId: {
        color: '#666',
        marginTop: 2,
    },
    styleActions: {
        flexDirection: 'row',
        alignItems: 'center',
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
});
