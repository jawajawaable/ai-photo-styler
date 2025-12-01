import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Surface, useTheme } from 'react-native-paper';
import { supabase } from '../services/supabaseClient';

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const theme = useTheme();

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Hata', 'Lütfen e-posta ve şifre girin.');
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                Alert.alert('Başarılı', 'Kayıt olundu! Lütfen giriş yapın.');
                setIsLogin(true);
            }
        } catch (error) {
            Alert.alert('Hata', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Surface style={styles.card} elevation={4}>
                <Text variant="headlineMedium" style={styles.title}>
                    {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                </Text>

                <TextInput
                    label="E-posta"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                    mode="outlined"
                />

                <TextInput
                    label="Şifre"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                    mode="outlined"
                />

                <Button
                    mode="contained"
                    onPress={handleAuth}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                >
                    {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                </Button>

                <Button
                    mode="text"
                    onPress={() => setIsLogin(!isLogin)}
                    style={styles.switchButton}
                >
                    {isLogin ? 'Hesabın yok mu? Kayıt Ol' : 'Zaten hesabın var mı? Giriş Yap'}
                </Button>
            </Surface>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    card: {
        padding: 20,
        borderRadius: 10,
        backgroundColor: 'white',
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: 'bold',
    },
    input: {
        marginBottom: 12,
    },
    button: {
        marginTop: 10,
        paddingVertical: 6,
    },
    switchButton: {
        marginTop: 10,
    }
});
