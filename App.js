import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';

/**
 * Ultra-minimal App Component 
 * No dependencies, no complex logic
 * No imports from other libraries besides React and React Native core
 */
export default function App() {
  const [count, setCount] = React.useState(0);
  
  console.log('Ultra minimal app rendering with updated header text:', count);
  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>React Native Future Me</Text>
      
      <View style={styles.card}>
        <Text style={styles.title}>React Native Test App</Text>
        <Text style={styles.paragraph}>
          This is the REACT NATIVE version of the Future Me app - it should look different from the HTML version!
        </Text>
        
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>React Native Counter: {count} times</Text>
          <Button
            title="Click React Native Button"
            onPress={() => setCount(count + 1)}
            color="#FF4500"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#6200EE',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
    lineHeight: 24,
  },
  counterContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  counterText: {
    fontSize: 18,
    marginBottom: 15,
    color: '#333',
  },
});
