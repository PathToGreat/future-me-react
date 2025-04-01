import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';

// Local imports
import { theme } from './src/config/theme';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Ignore specific warnings for development
LogBox.ignoreLogs([
  'AsyncStorage has been extracted from react-native core', // Expo related
  'Setting a timer for a long period of time', // Firebase timer warning
  'Require cycle:', // Common in React Native projects
  'Sending `onAnimatedValueUpdate`', // Animation related
]);

// Main App component
export default function App() {
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
