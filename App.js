import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, ScrollView, TouchableOpacity, SafeAreaView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

// Import Firebase configuration
import { 
  app, 
  auth, 
  db, 
  signInWithGoogle, 
  loginWithEmail,
  registerWithEmail,
  logoutUser
} from './src/config/firebase';

/**
 * Main App Component
 * Starting with a simplified version to verify proper rendering
 * and basic Firebase functionality
 */
export default function App() {
  // App state
  const [counter, setCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [displayMode, setDisplayMode] = useState('main'); // main, login, register
  
  // Load required fonts (simplified for initial testing)
  useEffect(() => {
    // Skip actual font loading for now, just set as loaded
    setFontsLoaded(true);
    console.log('Skipping font loading for initial test');
    
    // In the full version, we would load custom fonts:
    // async function loadFonts() {
    //   try {
    //     await Font.loadAsync({
    //       'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    //       'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
    //       ...Ionicons.font,
    //     });
    //     setFontsLoaded(true);
    //   } catch (error) {
    //     console.error('Error loading fonts:', error);
    //     setFontsLoaded(true);
    //   }
    // }
    // loadFonts();
  }, []);
  
  // Set up auth listener
  useEffect(() => {
    console.log('Setting up auth listener in App.js');
    
    // Firebase auth state listener
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      console.log('Auth state changed:', currentUser ? 'logged in' : 'logged out');
      setIsLoading(false);
      
      if (currentUser) {
        setUser(currentUser);
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    }, (error) => {
      console.error('Auth state change error:', error);
      setAuthError(error.message);
      setIsLoading(false);
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);
  
  // Mock email login for testing
  const handleEmailLogin = async () => {
    try {
      setIsLoading(true);
      // For testing, use a consistent email/password
      await loginWithEmail('test@example.com', 'password123');
      setAuthError(null);
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.message);
      Alert.alert('Login Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout handler
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show loading screen
  if (isLoading && !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Future Me...</Text>
      </View>
    );
  }

  // Use this simplified test UI for basic functionality testing
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Future Me</Text>
          <Text style={styles.subtitle}>Build better habits, shape your future</Text>
        </View>
        
        {/* Authentication status card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Authentication Status</Text>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={[
              styles.statusValue, 
              { color: isLoggedIn ? '#4CAF50' : '#F44336' }
            ]}>
              {isLoggedIn ? 'Logged In' : 'Not Logged In'}
            </Text>
          </View>
          
          {user && (
            <View style={styles.userInfo}>
              <Text style={styles.userInfoText}>
                <Text style={{fontWeight: 'bold'}}>Email:</Text> {user.email}
              </Text>
              {user.displayName && (
                <Text style={styles.userInfoText}>
                  <Text style={{fontWeight: 'bold'}}>Name:</Text> {user.displayName}
                </Text>
              )}
            </View>
          )}
          
          {authError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}
          
          <View style={styles.authButtons}>
            {!isLoggedIn ? (
              <Button 
                title="Test Login" 
                onPress={handleEmailLogin} 
                color="#6200EE"
              />
            ) : (
              <Button 
                title="Logout" 
                onPress={handleLogout} 
                color="#F44336"
              />
            )}
          </View>
        </View>
        
        {/* Counter test card to verify state updates */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Interactive Test</Text>
          <Text style={styles.cardDescription}>
            Verify React state updates are working
          </Text>
          
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>Counter: {counter}</Text>
            <Button 
              title="Increment Counter" 
              onPress={() => setCounter(counter + 1)} 
              color="#4CAF50"
            />
          </View>
        </View>
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  scrollContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200EE',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusLabel: {
    fontSize: 16,
    marginRight: 10,
    color: '#333',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  userInfoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  authButtons: {
    marginTop: 10,
  },
  counterContainer: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
  },
  counterText: {
    fontSize: 18,
    marginBottom: 15,
    color: '#333',
  },
});
