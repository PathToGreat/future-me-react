import React from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Future Me</Text>
      <Text style={styles.paragraph}>
        Simple test screen
      </Text>
      <Button
        title="Press me"
        onPress={() => alert('It works!')}
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
});
