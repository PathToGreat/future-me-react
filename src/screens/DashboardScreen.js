import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  useTheme,
  FAB,
  ProgressBar,
  Divider,
  Surface,
  Avatar
} from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getDailyHabits, completeHabitForToday } from '../services/habitService';
import DailyCheckIn from '../components/DailyCheckIn';
import EmptyState from '../components/EmptyState';
import ProgressChart from '../components/ProgressChart';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyHabits, setDailyHabits] = useState([]);
  const [completionRate, setCompletionRate] = useState(0);
  const [streak, setStreak] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Function to load data
  const loadData = async () => {
    try {
      setLoading(true);
      const habits = await getDailyHabits(user.uid);
      setDailyHabits(habits);
      
      // Calculate completion rate
      if (habits.length > 0) {
        const completed = habits.filter(habit => 
          habit.logs && habit.logs[today] && habit.logs[today].completed
        ).length;
        setCompletionRate(completed / habits.length);
        
        // Get streak (just a sample calculation - would need more sophisticated logic)
        // This is a placeholder - in a real app we'd need to look at daily history
        setStreak(Math.floor(Math.random() * 10) + 1); // Placeholder
      } else {
        setCompletionRate(0);
        setStreak(0);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load data when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [user.uid, refreshKey])
  );
  
  // Pull-to-refresh functionality
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  // Handle habit completion
  const handleCompleteHabit = async (habitId) => {
    try {
      await completeHabitForToday(user.uid, habitId);
      // Force refresh
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error completing habit:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Greeting Card */}
        <Surface style={styles.greeting}>
          <View style={styles.greetingContent}>
            <View>
              <Text style={styles.hello}>Hello,</Text>
              <Text style={styles.name}>{userProfile?.displayName || 'Friend'}</Text>
              <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            </View>
            <Avatar.Image 
              size={60} 
              source={{ uri: userProfile?.photoURL || 'https://ui-avatars.com/api/?name=Future+Me&background=6200EE&color=fff' }} 
            />
          </View>
        </Surface>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Feather name="check-circle" size={24} color={theme.colors.primary} style={styles.statIcon} />
              <Title style={styles.statValue}>{Math.round(completionRate * 100)}%</Title>
              <Paragraph style={styles.statLabel}>Completed Today</Paragraph>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content>
              <Feather name="trending-up" size={24} color={theme.colors.accent} style={styles.statIcon} />
              <Title style={styles.statValue}>{streak}</Title>
              <Paragraph style={styles.statLabel}>Day Streak</Paragraph>
            </Card.Content>
          </Card>
        </View>
        
        {/* Progress Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Weekly Progress</Title>
            <ProgressChart refreshKey={refreshKey} userId={user.uid} />
          </Card.Content>
        </Card>
        
        {/* Today's Habits */}
        <View style={styles.habitsSection}>
          <Title style={styles.sectionTitle}>Today's Habits</Title>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ProgressBar indeterminate />
              <Text style={styles.loadingText}>Loading your habits...</Text>
            </View>
          ) : dailyHabits.length === 0 ? (
            <EmptyState
              icon="calendar-plus"
              title="No habits for today"
              message="Add some habits to start tracking your progress"
              actionLabel="Add Habit"
              onAction={() => navigation.navigate('Habits', { screen: 'HabitList' })}
            />
          ) : (
            <View style={styles.habitsList}>
              {dailyHabits.map((habit) => (
                <DailyCheckIn
                  key={habit.id}
                  habit={habit}
                  onComplete={() => handleCompleteHabit(habit.id)}
                  today={today}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('Habits', { screen: 'HabitList', params: { showAddHabit: true } })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  greeting: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  greetingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hello: {
    fontSize: 16,
    color: '#666',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
  },
  statIcon: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  statValue: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    textAlign: 'center',
    color: '#666',
  },
  chartCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  habitsSection: {
    marginBottom: 16,
  },
  habitsList: {
    marginTop: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default DashboardScreen;
