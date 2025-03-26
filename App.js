import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Platform } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { auth } from './src/config/firebase';

function MainApp() {
  const [error, setError] = useState(null);
  const [info, setInfo] = useState({
    platform: Platform.OS,
    screenDimensions: {
      width: typeof window !== 'undefined' ? window.innerWidth : 'unknown',
      height: typeof window !== 'undefined' ? window.innerHeight : 'unknown'
    },
    firebaseInitialized: !!auth
  });

  useEffect(() => {
    // Check if running in browser (for web)
    if (typeof window !== 'undefined') {
      console.log('App is running in web environment');
    }
    
    // This will help troubleshoot rendering issues
    try {
      console.log('App component mounted');
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Firebase initialized:', !!auth); 
    } catch (err) {
      console.error('Init Error:', err);
      setError(`Init Error: ${err.message}`);
    }
  }, []);

  const handleButtonPress = () => {
    try {
      console.log('Button pressed!');
      alert('It works!');
    } catch (err) {
      console.error('Button Error:', err);
      setError(`Button Error: ${err.message}`);
    }
  };

  const checkFirebase = () => {
    try {
      console.log('Checking Firebase status...');
      console.log('Auth object exists:', !!auth);
      alert(`Firebase initialized: ${!!auth}`);
    } catch (err) {
      console.error('Firebase Check Error:', err);
      setError(`Firebase Error: ${err.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Future Me</Text>
      <Text style={styles.paragraph}>
        This is a test screen to verify Expo Web with Firebase
      </Text>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      ) : null}
      
      <Text style={styles.infoText}>
        Platform: {info.platform}{'\n'}
        Width: {info.screenDimensions.width}{'\n'}
        Height: {info.screenDimensions.height}{'\n'}
        Firebase: {info.firebaseInitialized ? 'Initialized' : 'Not Initialized'}
      </Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Test UI"
          onPress={handleButtonPress}
          color="#6200EE"
        />
        
        <Button
          title="Check Firebase"
          onPress={checkFirebase}
          color="#03DAC6"
        />
      </View>
    </View>
  );
}

// The main application wrapped with the AuthProvider
export default function App() {
  // Catch any errors that might happen during rendering
  try {
    return (
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    );
  } catch (error) {
    console.error('Fatal error in App render:', error);
    
    // Render a fallback error UI
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Error</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            A fatal error occurred: {error.message}
          </Text>
        </View>
        <Button
          title="Reload Page"
          onPress={() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
          color="#6200EE"
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: '#ffeeee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#dd0000',
    fontSize: 14,
  },
  infoText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  }
});
