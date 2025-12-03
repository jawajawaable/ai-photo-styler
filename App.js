import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, MD3LightTheme, Text, Icon } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './src/screens/HomeScreen';
import StyleResultScreen from './src/screens/StyleResultScreen';
import StyleDetailScreen from './src/screens/StyleDetailScreen';
import ResultDetailScreen from './src/screens/ResultDetailScreen';
import AuthScreen from './src/screens/AuthScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminScreen from './src/screens/AdminScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import PurchaseScreen from './src/screens/PurchaseScreen';
import { supabase } from './src/services/supabaseClient';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    background: '#fff',
    surface: '#f5f5f5',
  },
};

const ONBOARDING_KEY = '@satrayni_onboarding_complete';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedImages, setSelectedImages] = useState([]); // Array of images
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [session, setSession] = useState(null);
  const [credits, setCredits] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(null);

  useEffect(() => {
    checkOnboarding();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchCredits(session.user.id);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchCredits(session.user.id);
    });
  }, []);

  const checkOnboarding = async () => {
    const hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
    setShowOnboarding(hasSeenOnboarding !== 'true');
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const fetchCredits = async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (data) {
      setCredits(data.credits);
    } else if (error) {
      console.error('Error fetching credits:', error);
    }
  };

  // Step 1: User clicks a style on Home -> Goes to Detail Screen
  const navigateToStyleDetail = (style) => {
    setSelectedStyle(style);
    setCurrentScreen('style-detail');
  };

  // Step 2: User clicks "Continue" on Detail Screen -> Create job and go to Profile
  const navigateToResult = async ({ style, images }) => {
    setSelectedStyle(style);
    setSelectedImages(images);
    // Job will be created in StyleDetailScreen
    // Navigate to profile to see the job
    setCurrentScreen('profile');
  };

  const navigateHome = () => {
    setCurrentScreen('home');
    setSelectedImages([]);
    setSelectedStyle(null);
    if (session) fetchCredits(session.user.id);
  };

  const navigateToProfile = () => {
    setCurrentScreen('profile');
  };

  const navigateToJobDetail = (job) => {
    setSelectedImages([job]); // Use selectedImages to store current job
    setCurrentScreen('job-detail');
  };

  const navigateToAdmin = () => {
    setCurrentScreen('admin');
  };

  const navigateToPurchase = () => {
    setCurrentScreen('purchase');
  };

  // Custom Bottom Navigation Component
  const BottomNav = () => (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => setCurrentScreen('home')}
      >
        <Icon
          source={currentScreen === 'home' ? "compass" : "compass-outline"}
          size={24}
          color={currentScreen === 'home' ? '#fff' : '#666'}
        />
        <Text style={[styles.navText, currentScreen === 'home' && styles.navTextActive]}>Keşfet</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          // "One Shot" action - maybe open camera or just go to upload?
          // For now, let's make it go to home but maybe scroll to upload if we had it
          setCurrentScreen('home');
        }}
      >
        <Icon source="camera-plus-outline" size={24} color="#666" />
        <Text style={styles.navText}>Hızlı Yap</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => setCurrentScreen('profile')}
      >
        <Icon
          source={currentScreen === 'profile' ? "account" : "account-outline"}
          size={24}
          color={currentScreen === 'profile' ? '#fff' : '#666'}
        />
        <Text style={[styles.navText, currentScreen === 'profile' && styles.navTextActive]}>Profilim</Text>
      </TouchableOpacity>
    </View>
  );

  const renderScreen = () => {
    if (showOnboarding === null) return null;
    if (showOnboarding) return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    if (!session) return <AuthScreen />;

    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            onStyleSelected={navigateToStyleDetail}
            userId={session.user.id}
            credits={credits}
            onProfilePress={navigateToProfile}
          />
        );
      case 'style-detail':
        return (
          <StyleDetailScreen
            style={selectedStyle}
            userId={session.user.id}
            onBack={navigateHome}
            onContinue={navigateToResult}
          />
        );
      case 'style-result':
        return (
          <StyleResultScreen
            inputImages={selectedImages}
            initialStyle={selectedStyle}
            onBack={navigateHome}
            userId={session.user.id}
            credits={credits}
            onCreditsUpdate={() => session && fetchCredits(session.user.id)}
            onPurchasePress={navigateToPurchase}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            userId={session.user.id}
            onBack={navigateHome}
            onAdminPress={navigateToAdmin}
            onPurchasePress={navigateToPurchase}
            credits={credits}
            onJobPress={navigateToJobDetail}
          />
        );
      case 'job-detail':
        return (
          <ResultDetailScreen
            job={selectedImages[0]}
            onBack={navigateToProfile}
            onDelete={() => {
              // Refresh will happen when navigating back to profile
              navigateToProfile();
            }}
          />
        );
      case 'purchase':
        return (
          <PurchaseScreen
            onBack={navigateToProfile}
            credits={credits}
          />
        );
      case 'admin':
        return (
          <AdminScreen
            userId={session.user.id}
            onBack={navigateHome}
            credits={credits}
          />
        );
      default:
        return <HomeScreen />;
    }
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <View style={styles.container}>
          {renderScreen()}

          {/* Show Bottom Nav only on main screens */}
          {session && !showOnboarding && ['home', 'profile'].includes(currentScreen) && (
            <BottomNav />
          )}
        </View>
        <StatusBar style="auto" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#333',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 10,
    color: '#666',
  },
  navTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
