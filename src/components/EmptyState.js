import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

const EmptyState = ({ 
  icon = 'inbox', 
  title = 'Nothing here', 
  message = 'There are no items to display', 
  actionLabel, 
  onAction 
}) => {
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      <Feather name={icon} size={80} color={theme.colors.disabled} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {actionLabel && onAction && (
        <Button 
          mode="contained" 
          onPress={onAction}
          style={styles.button}
          icon={(props) => <Feather name="plus" {...props} />}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  title: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginHorizontal: 40,
    marginBottom: 20,
  },
  button: {
    marginTop: 16,
  },
});

export default EmptyState;
