import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, Button, ActivityIndicator } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from './src/config/theme';

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('App mounting with simplified structure');
    // Simulate loading
    const timer = setTimeout(() => {
      console.log('Setting loading to false');
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6200EE' }}>
        <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold', marginBottom: 20 }}>Future Me</Text>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Welcome to Future Me</Text>
        <Text style={{ marginBottom: 20, textAlign: 'center' }}>
          This is a simplified version of the app to help debug the blank screen issue.
        </Text>
        <Button 
          title="Test Button" 
          onPress={() => alert('Button works!')} 
          color={theme.colors.primary}
        />
        <StatusBar style="auto" />
      </View>
    </PaperProvider>
  );
}
