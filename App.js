import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';

/**
 * Super-ultra-minimal App Component 
 * No dependencies, no complex logic, no shadows
 * No imports from other libraries besides React and React Native core
 */
export default function App() {
  const [count, setCount] = React.useState(0);
  
  console.log('Super minimal app rendering with count:', count);
  
  return (
    <View style={styles.container}>
      <Text>React Native Future Me - Minimal Version</Text>
      <Text>Count: {count}</Text>
      <Button
        title="Increment"
        onPress={() => setCount(count + 1)}
        color="#FF4500"
      />
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
    gap: 20,
  },
});
