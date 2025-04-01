import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { LogBox, Text, View } from 'react-native';

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

// Debug component to catch errors
const ErrorBoundary = ({ children }) => {
  try {
    return children;
  } catch (error) {
    console.error("Caught error in ErrorBoundary:", error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', fontSize: 18, marginBottom: 10 }}>
          Something went wrong!
        </Text>
        <Text style={{ color: '#333', marginBottom: 20 }}>
          {error?.message || "Unknown error"}
        </Text>
      </View>
    );
  }
};

// Main App component
export default function App() {
  useEffect(() => {
    console.log("App component mounted");
    
    // Testing that theme is properly defined
    console.log("Theme colors:", Object.keys(theme.colors));
    
    return () => {
      console.log("App component unmounted");
    };
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <ErrorBoundary>
              <AppNavigator />
            </ErrorBoundary>
            <StatusBar style="auto" />
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
