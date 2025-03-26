import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from './src/config/theme';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { enableScreens } from 'react-native-screens';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import { View, Text, ActivityIndicator } from 'react-native';

// Import Firebase configuration to ensure it's initialized
import './src/config/firebase';

// Enable screens for better navigation performance
enableScreens();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Firebase is now initialized in src/config/firebase.js
        console.log('App initializing...');
        console.log('Theme loaded:', !!theme);
        console.log('Ready to hide splash screen');
        
        // Add artificial delay for enhanced loading experience
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.error('Error during initialization:', e);
      } finally {
        console.log('Setting app as ready');
        // Tell the application to render
        setAppIsReady(true);
        try {
          await SplashScreen.hideAsync();
          console.log('Splash screen hidden');
        } catch (e) {
          console.error('Error hiding splash screen:', e);
        }
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.primary }}>
        <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold', marginBottom: 20 }}>Future Me</Text>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
