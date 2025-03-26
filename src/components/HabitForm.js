import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  Chip, 
  useTheme, 
  HelperText,
  RadioButton,
  Divider,
  Title
} from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { addHabit, updateHabit } from '../services/habitService';
import DateTimePicker from '@react-native-community/datetimepicker';

const CATEGORIES = [
  { name: 'health', icon: 'heart' },
  { name: 'fitness', icon: 'activity' },
  { name: 'learning', icon: 'book' },
  { name: 'career', icon: 'briefcase' },
  { name: 'finance', icon: 'dollar-sign' },
  { name: 'relationships', icon: 'users' },
  { name: 'mindfulness', icon: 'sun' },
  { name: 'productivity', icon: 'check-square' },
  { name: 'other', icon: 'grid' }
];

const DAYS_OF_WEEK = [
  { label: 'Mon', value: 0 },
  { label: 'Tue', value: 1 },
  { label: 'Wed', value: 2 },
  { label: 'Thu', value: 3 },
  { label: 'Fri', value: 4 },
  { label: 'Sat', value: 5 },
  { label: 'Sun', value: 6 }
];

const ICONS = [
  'activity', 'heart', 'book', 'briefcase', 'dollar-sign', 'users', 
  'sun', 'check-square', 'grid', 'coffee', 'droplet', 'music', 
  'phone', 'zap', 'code', 'smile', 'trending-up', 'award'
];

const HabitForm = ({ userId, existingHabit, onSubmit, onCancel }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [icon, setIcon] = useState('');
  const [frequencyType, setFrequencyType] = useState('daily');
  const [selectedDays, setSelectedDays] = useState([]);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [goal, setGoal] = useState('');
  
  // Validation state
  const [nameError, setNameError] = useState('');
  const [frequencyError, setFrequencyError] = useState('');
  
  // Initialize form with existing habit data if editing
  useEffect(() => {
    if (existingHabit) {
      setName(existingHabit.name || '');
      setDescription(existingHabit.description || '');
      setCategory(existingHabit.category || '');
      setIcon(existingHabit.icon || '');
      
      if (existingHabit.frequency) {
        setFrequencyType(existingHabit.frequency.type || 'daily');
        setSelectedDays(existingHabit.frequency.days || []);
      }
      
      if (existingHabit.reminder) {
        setShowReminder(true);
        // Parse time string like "08:00" to Date
        const [hours, minutes] = existingHabit.reminder.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes);
        setReminderTime(date);
      }
      
      setGoal(existingHabit.goal || '');
    }
  }, [existingHabit]);
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    let isValid = true;
    
    if (!name.trim()) {
      setNameError('Habit name is required');
      isValid = false;
    } else {
      setNameError('');
    }
    
    if (frequencyType === 'weekly' && selectedDays.length === 0) {
      setFrequencyError('Select at least one day');
      isValid = false;
    } else {
      setFrequencyError('');
    }
    
    if (!isValid) return;
    
    try {
      setLoading(true);
      
      // Prepare habit data
      const habitData = {
        name: name.trim(),
        description: description.trim(),
        category: category || 'other',
        icon: icon || CATEGORIES.find(c => c.name === (category || 'other'))?.icon || 'activity',
        frequency: {
          type: frequencyType,
          days: frequencyType === 'weekly' ? selectedDays : []
        },
        reminder: showReminder ? 
          `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}` 
          : null,
        goal: goal.trim(),
        updatedAt: new Date().toISOString()
      };
      
      // Add or update habit
      if (existingHabit) {
        await updateHabit(userId, existingHabit.id, habitData);
      } else {
        habitData.createdAt = new Date().toISOString();
        await addHabit(userId, habitData);
      }
      
      onSubmit();
    } catch (error) {
      console.error('Error saving habit:', error);
      Alert.alert('Error', 'Failed to save habit. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle a day selection for weekly frequency
  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
    setFrequencyError('');
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Habit Name */}
      <TextInput
        label="Habit Name*"
        value={name}
        onChangeText={text => {
          setName(text);
          if (text.trim()) setNameError('');
        }}
        mode="outlined"
        style={styles.input}
        error={!!nameError}
      />
      <HelperText type="error" visible={!!nameError}>
        {nameError}
      </HelperText>
      
      {/* Description */}
      <TextInput
        label="Description (optional)"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        style={styles.input}
        multiline
        numberOfLines={3}
      />
      
      {/* Category */}
      <Text style={styles.sectionTitle}>Category</Text>
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.name}
              selected={category === cat.name}
              onPress={() => setCategory(cat.name)}
              style={styles.categoryChip}
              avatar={<Feather name={cat.icon} size={16} color={category === cat.name ? theme.colors.primary : '#666'} />}
            >
              {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
            </Chip>
          ))}
        </ScrollView>
      </View>
      
      {/* Icon Selection */}
      <Text style={styles.sectionTitle}>Icon</Text>
      <View style={styles.iconsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {ICONS.map((iconName) => (
            <TouchableOpacity
              key={iconName}
              style={[
                styles.iconButton,
                icon === iconName && { backgroundColor: theme.colors.primary + '20' }
              ]}
              onPress={() => setIcon(iconName)}
            >
              <Feather
                name={iconName}
                size={24}
                color={icon === iconName ? theme.colors.primary : '#666'}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Frequency */}
      <Text style={styles.sectionTitle}>Frequency*</Text>
      <RadioButton.Group
        onValueChange={value => {
          setFrequencyType(value);
          setFrequencyError('');
        }}
        value={frequencyType}
      >
        <View style={styles.radioOption}>
          <RadioButton.Item 
            label="Daily" 
            value="daily" 
            position="leading"
            style={styles.radioItem}
          />
        </View>
        
        <View style={styles.radioOption}>
          <RadioButton.Item 
            label="Weekly" 
            value="weekly" 
            position="leading"
            style={styles.radioItem}
          />
        </View>
      </RadioButton.Group>
      
      {/* Days of week selection for weekly frequency */}
      {frequencyType === 'weekly' && (
        <View style={styles.daysContainer}>
          {DAYS_OF_WEEK.map((day) => (
            <Chip
              key={day.value}
              selected={selectedDays.includes(day.value)}
              onPress={() => toggleDay(day.value)}
              style={styles.dayChip}
              selectedColor={theme.colors.primary}
            >
              {day.label}
            </Chip>
          ))}
          {!!frequencyError && (
            <HelperText type="error" visible={true} style={styles.frequencyError}>
              {frequencyError}
            </HelperText>
          )}
        </View>
      )}
      
      {/* Reminder */}
      <View style={styles.reminderSection}>
        <View style={styles.reminderHeader}>
          <Text style={styles.sectionTitle}>Reminder</Text>
          <RadioButton.Group
            onValueChange={value => setShowReminder(value === 'yes')}
            value={showReminder ? 'yes' : 'no'}
          >
            <View style={styles.reminderToggle}>
              <RadioButton.Item 
                label="No" 
                value="no" 
                position="leading"
                style={styles.reminderRadioItem}
              />
              <RadioButton.Item 
                label="Yes" 
                value="yes" 
                position="leading"
                style={styles.reminderRadioItem}
              />
            </View>
          </RadioButton.Group>
        </View>
        
        {showReminder && (
          <View style={styles.timePicker}>
            <Text style={styles.timePickerLabel}>Time:</Text>
            <DateTimePicker
              value={reminderTime}
              mode="time"
              display="default"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setReminderTime(selectedDate);
                }
              }}
            />
          </View>
        )}
      </View>
      
      {/* Goal */}
      <TextInput
        label="Goal (optional)"
        value={goal}
        onChangeText={setGoal}
        mode="outlined"
        style={styles.input}
        placeholder="What do you hope to achieve with this habit?"
      />
      
      {/* Form Actions */}
      <View style={styles.actions}>
        <Button 
          mode="outlined" 
          onPress={onCancel} 
          style={styles.actionButton}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          mode="contained" 
          onPress={handleSubmit} 
          style={styles.actionButton}
          loading={loading}
          disabled={loading}
        >
          {existingHabit ? 'Update' : 'Create'}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  iconsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  radioOption: {
    marginVertical: 4,
  },
  radioItem: {
    paddingVertical: 4,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayChip: {
    margin: 4,
  },
  frequencyError: {
    width: '100%',
  },
  reminderSection: {
    marginBottom: 16,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderToggle: {
    flexDirection: 'row',
  },
  reminderRadioItem: {
    paddingVertical: 0,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timePickerLabel: {
    marginRight: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default HabitForm;
