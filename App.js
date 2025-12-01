import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import StyleResultScreen from './src/screens/StyleResultScreen';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
  },
};

export default function App() {
  const [currentScreen, setCurrentScreen] = React.useState('home');
  const [selectedImage, setSelectedImage] = React.useState(null);

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
        {currentScreen === 'home' ? (
          <HomeScreen onImageSelected={navigateToStyle} />
        ) : (
          <StyleResultScreen
            imageUri={selectedImage?.uri}
            imageBase64={selectedImage?.base64}
            onBack={navigateHome}
          />
        )}
        <StatusBar style="auto" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
