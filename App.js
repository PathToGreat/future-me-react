import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from './src/config/theme';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { enableScreens } from 'react-native-screens';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';

// Enable screens for better navigation performance
enableScreens();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize Firebase with environment variables
        const firebaseConfig = {
          apiKey: process.env.FIREBASE_API_KEY,
          authDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
          appId: process.env.FIREBASE_APP_ID
        };

        initializeApp(firebaseConfig);

        // Add artificial delay for enhanced loading experience
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
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
