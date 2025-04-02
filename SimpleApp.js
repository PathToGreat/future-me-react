import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';

export default function SimpleApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Future Me</Text>
      <Text style={styles.subtitle}>Simple Test - Platform: {Platform.OS}</Text>
      <Text style={styles.body}>
        This is a simplified version of the Future Me app to test React Native rendering.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  body: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    lineHeight: 24,
  },
});