import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ScrollView, Platform, SafeAreaView } from 'react-native';
import { CATEGORIES, preloadedHabits } from './src/utils/preloadedHabits';

/**
 * Future Me App Component
 * Displays preloaded habits from our categories
 */
export default function App() {
  const [categories, setCategories] = useState(Object.values(CATEGORIES));
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [habitsToShow, setHabitsToShow] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Set initial category when component mounts
  useEffect(() => {
    console.log('App component mounted on platform:', Platform.OS);
    if (categories.length > 0) {
      setSelectedCategory(categories[0]);
    }
    setIsLoaded(true);
  }, []);

  // Update habits when selected category changes
  useEffect(() => {
    if (selectedCategory) {
      console.log('Selected category:', selectedCategory);
      const filteredHabits = preloadedHabits.filter(
        habit => habit.category === selectedCategory
      );
      setHabitsToShow(filteredHabits);
    }
  }, [selectedCategory]);

  // Render a habit item
  const renderHabitItem = ({ item }) => (
    <View style={styles.habitCard}>
      <Text style={styles.habitTitle}>{item.title}</Text>
      <Text style={styles.habitDescription}>{item.description}</Text>
      <Text style={styles.habitFact}>Fact: {item.factDescription}</Text>
    </View>
  );

  // Render a category button
  const renderCategoryButton = (category) => (
    <Text
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.selectedCategory
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      {category}
    </Text>
  );

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading habits...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Future Me</Text>
        <Text style={styles.subtitle}>Preloaded Habits - {Platform.OS}</Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map(category => renderCategoryButton(category))}
      </ScrollView>
      
      <FlatList
        data={habitsToShow}
        renderItem={renderHabitItem}
        keyExtractor={(item) => item.title}
        style={styles.habitsList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    fontSize: 14,
    color: '#333',
  },
  selectedCategory: {
    backgroundColor: '#6200EE',
    color: 'white',
  },
  habitsList: {
    paddingHorizontal: 15,
    flex: 1,
  },
  habitCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  habitDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  habitFact: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
});
