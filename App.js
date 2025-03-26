import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Platform } from 'react-native';

export default function App() {
  const [error, setError] = useState(null);
  const [info, setInfo] = useState({
    platform: Platform.OS,
    screenDimensions: {
      width: typeof window !== 'undefined' ? window.innerWidth : 'unknown',
      height: typeof window !== 'undefined' ? window.innerHeight : 'unknown'
    }
  });

  useEffect(() => {
    // Check if running in browser (for web)
    if (typeof window !== 'undefined') {
      console.log('App is running in web environment');
    }
    
    // This will help troubleshoot rendering issues
    try {
      console.log('App component mounted');
    } catch (err) {
      setError(`Init Error: ${err.message}`);
    }
  }, []);

  const handleButtonPress = () => {
    try {
      console.log('Button pressed!');
      alert('It works!');
    } catch (err) {
      setError(`Button Error: ${err.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Future Me</Text>
      <Text style={styles.paragraph}>
        This is a test screen to verify Expo Web
      </Text>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      ) : null}
      
      <Text style={styles.infoText}>
        Platform: {info.platform}{'\n'}
        Width: {info.screenDimensions.width}{'\n'}
        Height: {info.screenDimensions.height}
      </Text>
      
      <Button
        title="Press me"
        onPress={handleButtonPress}
        color="#6200EE"
      />
    </View>
  );
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
  }
});
