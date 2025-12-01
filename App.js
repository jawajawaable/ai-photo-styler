import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import StyleResultScreen from './src/screens/StyleResultScreen';
import AuthScreen from './src/screens/AuthScreen';
import { supabase } from './src/services/supabaseClient';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
  },
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedImage, setSelectedImage] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  const navigateToStyle = (image) => {
    console.log("Selected Image:", image); // Debug log
    setSelectedImage(image);
    setCurrentScreen('style');
  };

  const navigateHome = () => {
    setCurrentScreen('home');
    setSelectedImage(null);
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        {!session ? (
          <AuthScreen />
        ) : currentScreen === 'home' ? (
          <HomeScreen onImageSelected={navigateToStyle} userId={session.user.id} />
        ) : (
          <StyleResultScreen
            imageUri={selectedImage?.uri}
            imageBase64={selectedImage?.base64}
            onBack={navigateHome}
            userId={session.user.id}
          />
        )}
        <StatusBar style="auto" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
