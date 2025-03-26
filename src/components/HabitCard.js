import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, IconButton, Chip, useTheme, Menu } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { getCompletionRate } from '../utils/habitUtils';

const HabitCard = ({ habit, onPress, onEdit, onDelete }) => {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = React.useState(false);
  
  // Calculate habit statistics
  const completionRate = getCompletionRate(habit);
  
  // Get color based on completion rate
  const getCompletionColor = (rate) => {
    if (rate >= 0.8) return theme.colors.success;
    if (rate >= 0.5) return theme.colors.warning;
    return theme.colors.error;
  };
  
  // Format days of week for weekly habits
  const formatFrequency = (frequency) => {
    if (!frequency) return 'Not set';
    
    if (frequency.type === 'daily') {
      return 'Every day';
    } else if (frequency.type === 'weekly') {
      const daysShort = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      return frequency.days.map(day => daysShort[day]).join(' · ');
    } else {
      return 'Custom';
    }
  };
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Surface style={styles.card}>
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
              <Feather 
                name={habit.icon || 'activity'} 
                size={24} 
                color={theme.colors.primary} 
              />
            </View>
          </View>
          
          <View style={styles.habitInfo}>
            <Text style={styles.habitName}>{habit.name}</Text>
            
            {habit.description && (
              <Text style={styles.habitDescription} numberOfLines={1}>
                {habit.description}
              </Text>
            )}
            
            <View style={styles.habitMeta}>
              <View style={styles.frequencyContainer}>
                <Feather name="calendar" size={14} color="#666" style={styles.metaIcon} />
                <Text style={styles.frequencyText}>
                  {formatFrequency(habit.frequency)}
                </Text>
              </View>
              
              <Chip 
                style={[styles.completionChip, { backgroundColor: getCompletionColor(completionRate) + '20' }]}
                textStyle={{ color: getCompletionColor(completionRate) }}
                mode="flat"
                compact
              >
                {Math.round(completionRate * 100)}% completed
              </Chip>
            </View>
          </View>
          
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item icon="pencil" onPress={() => {
              setMenuVisible(false);
              onEdit();
            }} title="Edit" />
            <Menu.Item icon="delete" onPress={() => {
              setMenuVisible(false);
              onDelete();
            }} title="Delete" />
          </Menu>
        </View>
        
        {/* Completion bar */}
        <View style={styles.completionBarContainer}>
          <View 
            style={[
              styles.completionBar, 
              { 
                width: `${completionRate * 100}%`,
                backgroundColor: getCompletionColor(completionRate)
              }
            ]} 
          />
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  habitDescription: {
    color: '#666',
    marginBottom: 8,
    fontSize: 14,
  },
  habitMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  frequencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 4,
  },
  frequencyText: {
    fontSize: 12,
    color: '#666',
  },
  completionChip: {
    height: 24,
  },
  completionBarContainer: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  completionBar: {
    height: '100%',
  },
});

export default HabitCard;
