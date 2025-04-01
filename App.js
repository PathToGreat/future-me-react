import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Simple test app to verify basic rendering
export default function App() {
  const [counter, setCounter] = React.useState(0);
  
  console.log('Basic App rendering with counter:', counter);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Future Me - Test App</Text>
      <Text style={styles.description}>This is a simplified version to test basic rendering</Text>
      
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>Counter: {counter}</Text>
        <Button 
          title="Increment" 
          onPress={() => setCounter(counter + 1)} 
        />
      </View>
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#6200EE',
  },
  description: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
  },
  counterContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  counterText: {
    fontSize: 18,
    marginBottom: 15,
    color: '#333',
  },
});
