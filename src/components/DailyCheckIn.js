import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, Checkbox, useTheme, IconButton } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

const DailyCheckIn = ({ habit, onComplete, today }) => {
  const theme = useTheme();
  
  // Check if habit is completed today
  const isCompleted = habit.logs && 
                     habit.logs[today] && 
                     habit.logs[today].completed;
  
  // Format time if reminder exists
  const formatReminderTime = (reminder) => {
    if (!reminder) return null;
    
    const [hours, minutes] = reminder.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Surface style={[
      styles.container, 
      isCompleted ? { borderLeftColor: theme.colors.success } : { borderLeftColor: theme.colors.primary }
    ]}>
      <View style={styles.checkboxContainer}>
        <Checkbox
          status={isCompleted ? 'checked' : 'unchecked'}
          onPress={onComplete}
          color={theme.colors.success}
        />
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.habitDetails}>
          <View style={styles.habitHeader}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
              <Feather 
                name={habit.icon || 'activity'} 
                size={18} 
                color={theme.colors.primary} 
              />
            </View>
            <Text style={styles.habitName}>{habit.name}</Text>
          </View>
          
          {habit.description && (
            <Text style={styles.habitDescription} numberOfLines={2}>
              {habit.description}
            </Text>
          )}
          
          {habit.reminder && (
            <View style={styles.reminderContainer}>
              <Feather name="bell" size={14} color="#666" style={styles.reminderIcon} />
              <Text style={styles.reminderText}>
                {formatReminderTime(habit.reminder)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={[styles.statusContainer, isCompleted ? styles.completedStatus : styles.pendingStatus]}>
          <Text style={[styles.statusText, isCompleted ? styles.completedText : styles.pendingText]}>
            {isCompleted ? 'Completed' : 'Pending'}
          </Text>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
  },
  checkboxContainer: {
    justifyContent: 'center',
    paddingLeft: 4,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitDetails: {
    flex: 1,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  habitName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  habitDescription: {
    fontSize: 12,
    color: '#666',
    marginLeft: 40,
    marginBottom: 4,
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 40,
  },
  reminderIcon: {
    marginRight: 4,
  },
  reminderText: {
    fontSize: 12,
    color: '#666',
  },
  statusContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  completedStatus: {
    backgroundColor: '#E6F4EA',
  },
  pendingStatus: {
    backgroundColor: '#FFF8E1',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedText: {
    color: '#4CAF50',
  },
  pendingText: {
    color: '#FFA000',
  },
});

export default DailyCheckIn;
