import React, { useState } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';

/**
 * Ultra-minimal App Component
 * No dependencies, no complex logic
 * Just basic React components
 */
export default function App() {
  const [count, setCount] = useState(0);
  
  console.log('Ultra minimal app rendering with count:', count);
  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Future Me - Minimal Test</Text>
      <Text>This is an ultra minimal test app</Text>
      
      <View style={styles.countContainer}>
        <Text>You clicked {count} times</Text>
        <Button
          onPress={() => setCount(count + 1)}
          title="Click me"
        />
      </View>
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'purple',
  },
  countContainer: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
  },
});
