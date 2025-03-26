import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

// This is a very simple app to test if rendering works at all
function MainApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Simple Test App</Text>
      <Text style={styles.paragraph}>
        If you can see this text, basic rendering is working!
      </Text>
    </View>
  );
}

// Simplified App component without any complex dependencies
export default function App() {
  return <MainApp />;
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
  }
});
