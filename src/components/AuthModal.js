import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform, KeyboardAvoidingView, ScrollView, Dimensions, Keyboard, Animated, Modal, ActivityIndicator } from 'react-native';
import { Text, TextInput, Icon } from 'react-native-paper';
import { supabase } from '../services/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function AuthModal({ visible, onClose, onLoginSuccess, initialMode = true }) {
    const [isLogin, setIsLogin] = useState(initialMode);

    useEffect(() => {
        if (visible) setIsLogin(initialMode);
    }, [visible, initialMode]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }

        setLoading(true);
        Keyboard.dismiss();
        try {
            if (isLogin) {
                // Login: this will replace the current session (guest or not)
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // App.js listener handles state change, closing modal is good UX
                onClose();
                if (onLoginSuccess) onLoginSuccess();
            } else {
                // SignUp: We are upgrading the guest account? 
                // Creating a NEW account usually via signUp. 
                // If user puts existing email -> error.

                // TODO: Decide if "SignUp" means "Link current guest to this email" or "Create new fresh account".
                // Since our "Guest" is a real user with random email, "Linking" means updating email/password.
                // Standard signUp creates a *new* user.
                // User asked "ayarlar kısmından halledilsin".
                // Let's stick to standard SignUp (New Account) for now to avoid complexity of account merging.
                // If they want to "Save" the guest account, that's a different "Update Profile" flow.
                // BUT, typically "Signup" in this context implies saving progress.
                // Let's try `updateUser` if user is currently a guest.

                const { data: { user } } = await supabase.auth.getUser();
                const isGuest = user?.email?.startsWith('guest_');

                if (isGuest && !isLogin) {
                    // Upgrade Guest Account
                    const { error } = await supabase.auth.updateUser({ email, password });
                    if (error) throw error;
                    Alert.alert('Başarılı', 'Hesabınız başarıyla kaydedildi! Lütfen e-postanızı onaylayın.');
                    onClose();
                } else {
                    // Standard Signup (if somehow not guest or forced)
                    const { error } = await supabase.auth.signUp({
                        email,
                        password,
                    });
                    if (error) throw error;
                    Alert.alert('Başarılı', 'Kayıt başarılı! Lütfen e-posta adresinizi kontrol edip onaylayın.');
                    setIsLogin(true);
                }
            }
        } catch (error) {
            Alert.alert('Hata', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.modalContainer}>
                <View style={styles.glassCard}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Icon source="close" size={24} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.formTitle}>{isLogin ? 'Giriş Yap' : 'Hesabı Kaydet'}</Text>
                    {isLogin ? null : <Text style={styles.subtitle}>Mevcut ilerlemenizi kaybetmemek için bir hesap oluşturun.</Text>}

                    <View style={styles.inputContainer}>
                        <Icon source="email-outline" size={20} color="#ccc" style={styles.inputIcon} />
                        <TextInput
                            placeholder="E-posta"
                            placeholderTextColor="#888"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            style={styles.input}
                            mode="outlined"
                            outlineColor="transparent"
                            activeOutlineColor="transparent"
                            textColor="#ffffff"
                            theme={{ colors: { text: '#ffffff', onSurfaceVariant: '#888' } }}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Icon source="lock-outline" size={20} color="#ccc" style={styles.inputIcon} />
                        <TextInput
                            placeholder="Şifre"
                            placeholderTextColor="#888"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            style={styles.input}
                            mode="outlined"
                            outlineColor="transparent"
                            activeOutlineColor="transparent"
                            textColor="#ffffff"
                            right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} color="#888" onPress={() => setShowPassword(!showPassword)} />}
                            theme={{ colors: { text: '#ffffff', onSurfaceVariant: '#888' } }}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleAuth}
                        disabled={loading}
                        style={styles.mainButtonWrapper}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.mainButton}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.mainButtonText}>
                                    {isLogin ? 'Giriş Yap' : 'Kaydet & Devam Et'}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.switchContainer}>
                        <Text style={styles.switchText}>
                            {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
                        </Text>
                        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                            <Text style={styles.switchButton}>
                                {isLogin ? 'Kayıt Ol (Kaydet)' : 'Giriş Yap'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        padding: 24,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    subtitle: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        marginTop: -20
    },
    glassCard: {
        backgroundColor: '#111',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    formTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 32,
        textAlign: 'center',
        letterSpacing: -1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 0,
        height: 64,
        paddingHorizontal: 8,
    },
    inputIcon: {
        marginLeft: 16,
    },
    input: {
        flex: 1,
        backgroundColor: 'transparent',
        fontSize: 16,
        height: 56,
        color: '#fff',
    },
    mainButtonWrapper: {
        marginTop: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    mainButton: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
        gap: 8,
    },
    switchText: {
        color: '#666',
        fontSize: 14,
    },
    switchButton: {
        color: '#10b981',
        fontSize: 14,
        fontWeight: '700',
    },
});
