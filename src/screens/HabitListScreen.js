import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { 
  Text, 
  FAB, 
  useTheme, 
  Dialog, 
  Portal, 
  Button,
  ActivityIndicator,
  Searchbar,
  Chip,
  Divider,
  Title,
  Paragraph
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getAllHabits, deleteHabit } from '../services/habitService';
import HabitCard from '../components/HabitCard';
import HabitForm from '../components/HabitForm';
import EmptyState from '../components/EmptyState';

const HabitListScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [filteredHabits, setFilteredHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(route.params?.showAddHabit || false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Load all habits
  const loadHabits = async () => {
    try {
      setLoading(true);
      const habitsData = await getAllHabits(user.uid);
      setHabits(habitsData);
      setFilteredHabits(habitsData);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load habits on initial render and whenever the dependencies change
  useEffect(() => {
    loadHabits();
  }, [user.uid]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  };

  // Filter and search habits
  useEffect(() => {
    let result = [...habits];
    
    // Apply category filter
    if (selectedFilter !== 'all') {
      result = result.filter(habit => habit.category === selectedFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(habit => 
        habit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (habit.description && habit.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredHabits(result);
  }, [habits, selectedFilter, searchQuery]);

  // Handle edit habit
  const handleEditHabit = (habit) => {
    setSelectedHabit(habit);
    setFormVisible(true);
  };

  // Handle delete habit
  const handleDeleteHabit = (habitId) => {
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
              setHabits(habits.filter(h => h.id !== habitId));
            } catch (error) {
              console.error('Error deleting habit:', error);
              Alert.alert('Error', 'Failed to delete habit. Please try again.');
            }
          }
        },
      ]
    );
  };

  // Handle form submission (add or edit)
  const handleFormSubmit = () => {
    setFormVisible(false);
    setSelectedHabit(null);
    loadHabits();
  };

  // Get unique categories for filter chips
  const categories = ['all', ...new Set(habits.map(habit => habit.category))];

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <Searchbar
        placeholder="Search habits..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {/* Category filter chips */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersLabel}>Filter:</Text>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Chip
              selected={selectedFilter === item}
              onPress={() => setSelectedFilter(item)}
              style={styles.filterChip}
              selectedColor={theme.colors.primary}
            >
              {item === 'all' ? 'All' : item}
            </Chip>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>
      
      <Divider style={styles.divider} />
      
      {/* Habits list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your habits...</Text>
        </View>
      ) : filteredHabits.length === 0 ? (
        <EmptyState
          icon="clipboard-list"
          title={
            searchQuery || selectedFilter !== 'all' 
              ? "No matching habits found" 
              : "No habits yet"
          }
          message={
            searchQuery || selectedFilter !== 'all'
              ? "Try changing your search or filter"
              : "Add your first habit to start building your future"
          }
          actionLabel="Add Habit"
          onAction={() => setFormVisible(true)}
        />
      ) : (
        <FlatList
          data={filteredHabits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HabitCard
              habit={item}
              onPress={() => navigation.navigate('HabitDetail', { habitId: item.id, habitName: item.name })}
              onEdit={() => handleEditHabit(item)}
              onDelete={() => handleDeleteHabit(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
      
      {/* Add Habit FAB */}
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => {
          setSelectedHabit(null);
          setFormVisible(true);
        }}
      />
      
      {/* Habit Form Dialog */}
      <Portal>
        <Dialog
          visible={formVisible}
          onDismiss={() => {
            setFormVisible(false);
            setSelectedHabit(null);
          }}
          style={styles.dialog}
        >
          <Dialog.Title>{selectedHabit ? 'Edit Habit' : 'Add New Habit'}</Dialog.Title>
          <Dialog.Content>
            <HabitForm
              userId={user.uid}
              existingHabit={selectedHabit}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setFormVisible(false);
                setSelectedHabit(null);
              }}
            />
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  searchBar: {
    margin: 16,
    borderRadius: 8,
    elevation: 2,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filtersLabel: {
    marginRight: 8,
    fontSize: 16,
    color: '#666',
  },
  filterChip: {
    marginRight: 8,
  },
  divider: {
    marginBottom: 8,
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  dialog: {
    maxHeight: '80%',
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
});

export default HabitListScreen;
