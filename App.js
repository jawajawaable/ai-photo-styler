import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import StyleResultScreen from './src/screens/StyleResultScreen';
import AuthScreen from './src/screens/AuthScreen';
import ProfileScreen from './src/screens/ProfileScreen';
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
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchCredits(session.user.id);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchCredits(session.user.id);
    });
  }, []);

  const fetchCredits = async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (data) {
      setCredits(data.credits);
    }
  };

  const navigateToStyle = (image) => {
    console.log("Selected Image:", image); // Debug log
    setSelectedImage(image);
    setCurrentScreen('style');
  };

  const navigateHome = () => {
    setCurrentScreen('home');
    setSelectedImage(null);
    if (session) fetchCredits(session.user.id); // Refresh credits on return
  };

  const navigateToProfile = () => {
    setCurrentScreen('profile');
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        {!session ? (
          <AuthScreen />
        ) : currentScreen === 'home' ? (
          <HomeScreen
            onImageSelected={navigateToStyle}
            userId={session.user.id}
            credits={credits}
            onProfilePress={navigateToProfile}
          />
        ) : currentScreen === 'profile' ? (
          <ProfileScreen
            userId={session.user.id}
            onBack={navigateHome}
          />
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
