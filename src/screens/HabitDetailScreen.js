import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Paragraph, 
  useTheme, 
  ActivityIndicator,
  Button,
  Divider,
  Chip,
  IconButton,
  Menu,
  Surface
} from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getHabitById, deleteHabit } from '../services/habitService';
import ProgressChart from '../components/ProgressChart';
import { getDaysSinceCreation, getCompletionRate } from '../utils/habitUtils';
import { getProjectedData } from '../utils/projectionUtils';

const HabitDetailScreen = () => {
  const theme = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { habitId } = route.params;
  
  const [habit, setHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [projectionData, setProjectionData] = useState(null);
  
  // Load habit details
  useEffect(() => {
    const loadHabitDetails = async () => {
      try {
        setLoading(true);
        const habitData = await getHabitById(user.uid, habitId);
        setHabit(habitData);
        
        // Generate projection data based on current habit performance
        const completion = getCompletionRate(habitData);
        setProjectionData(getProjectedData(habitData, completion));
      } catch (error) {
        console.error('Error loading habit details:', error);
        Alert.alert('Error', 'Failed to load habit details');
      } finally {
        setLoading(false);
      }
    };
    
    loadHabitDetails();
  }, [habitId, user.uid]);
  
  // Handle edit habit
  const handleEditHabit = () => {
    setMenuVisible(false);
    navigation.navigate('HabitList', { editHabit: habit });
  };
  
  // Handle delete habit
  const handleDeleteHabit = () => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHabit(user.uid, habitId);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting habit:', error);
              Alert.alert('Error', 'Failed to delete habit');
            }
          }
        },
      ]
    );
  };
  
  // Format frequency label
  const getFrequencyLabel = (frequency) => {
    if (!frequency) return 'Not set';
    
    if (frequency.type === 'daily') {
      return 'Every day';
    } else if (frequency.type === 'weekly') {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const selectedDays = frequency.days.map(day => days[day]);
      return `Weekly on ${selectedDays.join(', ')}`;
    } else {
      return 'Custom frequency';
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading habit details...</Text>
      </View>
    );
  }
  
  if (!habit) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={50} color={theme.colors.error} />
        <Text style={styles.errorText}>Habit not found</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Go Back
        </Button>
      </View>
    );
  }
  
  // Calculate stats
  const daysSinceCreation = getDaysSinceCreation(habit);
  const completionRate = getCompletionRate(habit);
  const currentStreak = 7; // Placeholder - would need proper streak calculation
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Title style={styles.habitTitle}>{habit.name}</Title>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={24}
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item icon="pencil" onPress={handleEditHabit} title="Edit" />
            <Menu.Item icon="delete" onPress={handleDeleteHabit} title="Delete" />
          </Menu>
        </View>
        
        <Chip 
          icon={() => <Feather name={habit.icon || 'activity'} size={16} color={theme.colors.primary} />}
          style={styles.categoryChip}
        >
          {habit.category || 'Uncategorized'}
        </Chip>
      </View>
      
      {habit.description && (
        <Card style={styles.descriptionCard}>
          <Card.Content>
            <Paragraph>{habit.description}</Paragraph>
          </Card.Content>
        </Card>
      )}
      
      <Surface style={styles.detailsCard}>
        <Title style={styles.sectionTitle}>Habit Details</Title>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Feather name="calendar" size={20} color={theme.colors.primary} />
            <Text style={styles.detailLabel}>Frequency</Text>
            <Text style={styles.detailValue}>{getFrequencyLabel(habit.frequency)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Feather name="clock" size={20} color={theme.colors.primary} />
            <Text style={styles.detailLabel}>Reminder</Text>
            <Text style={styles.detailValue}>
              {habit.reminder ? habit.reminder : 'Not set'}
            </Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Feather name="flag" size={20} color={theme.colors.primary} />
            <Text style={styles.detailLabel}>Goal</Text>
            <Text style={styles.detailValue}>
              {habit.goal || 'Not set'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Feather name="calendar-plus" size={20} color={theme.colors.primary} />
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>
              {new Date(habit.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </Surface>
      
      <Surface style={styles.statsCard}>
        <Title style={styles.sectionTitle}>Stats</Title>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{daysSinceCreation}</Text>
            <Text style={styles.statLabel}>Days Tracked</Text>
          </View>
          
          <Divider style={styles.verticalDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(completionRate * 100)}%</Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </View>
          
          <Divider style={styles.verticalDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
        </View>
      </Surface>
      
      <Card style={styles.chartCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Weekly Progress</Title>
          <ProgressChart habitId={habitId} userId={user.uid} />
        </Card.Content>
      </Card>
      
      <Card style={styles.projectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Future Projection</Title>
          <Paragraph style={styles.projectionDescription}>
            Based on your current completion rate of {Math.round(completionRate * 100)}%, 
            here's how this habit might impact your future:
          </Paragraph>
          
          {projectionData && (
            <View style={styles.projectionItems}>
              {projectionData.map((item, index) => (
                <View key={index} style={styles.projectionItem}>
                  <Feather name={item.icon} size={24} color={theme.colors.primary} style={styles.projectionIcon} />
                  <Text style={styles.projectionTitle}>{item.title}</Text>
                  <Text style={styles.projectionValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginVertical: 16,
  },
  backButton: {
    marginTop: 20,
  },
  header: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  categoryChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  descriptionCard: {
    marginBottom: 16,
  },
  detailsCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  statsCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  verticalDivider: {
    height: '100%',
    width: 1,
    backgroundColor: '#ddd',
  },
  chartCard: {
    marginBottom: 16,
  },
  projectionCard: {
    marginBottom: 16,
  },
  projectionDescription: {
    marginBottom: 16,
  },
  projectionItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  projectionItem: {
    width: '48%',
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  projectionIcon: {
    marginBottom: 12,
  },
  projectionTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  projectionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default HabitDetailScreen;
