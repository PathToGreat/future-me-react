import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import { 
  Text, 
  Title, 
  Card, 
  Paragraph, 
  ActivityIndicator, 
  useTheme,
  Button,
  Divider,
  Surface,
  Portal,
  Modal
} from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getAllHabits } from '../services/habitService';
import { getCompletionRate } from '../utils/habitUtils';
import { getProjectedImpact, categorizeHabits } from '../utils/projectionUtils';
import { 
  calculatePhysicalChanges, 
  getPhysicalChangeDescriptions, 
  getAvatarGlowColor,
  calculateOverallHealthScore 
} from '../utils/avatarUtils';
import ProjectionChart from '../components/ProjectionChart';
import FutureAvatar from '../components/FutureAvatar';
import AvatarUploader from '../components/AvatarUploader';

const { width } = Dimensions.get('window');

const FutureProjectionScreen = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState([]);
  const [categorizedHabits, setCategorizedHabits] = useState({});
  const [overallScore, setOverallScore] = useState(0);
  const [timeFrame, setTimeFrame] = useState('3months'); // '3months', '6months', '1year'
  const [userImage, setUserImage] = useState(null);
  const [physicalChanges, setPhysicalChanges] = useState({});
  const [showUploader, setShowUploader] = useState(false);
  const [categoryCompletionRates, setCategoryCompletionRates] = useState({});
  
  // Load all habits
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const habitsData = await getAllHabits(user.uid);
        setHabits(habitsData);
        
        // Calculate overall score based on habits completion rate
        if (habitsData.length > 0) {
          const completionRates = habitsData.map(habit => getCompletionRate(habit));
          const avgCompletionRate = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;
          setOverallScore(avgCompletionRate * 100);
          
          // Calculate physical changes based on habits
          const changes = calculatePhysicalChanges(habitsData, getTimeFrameDays());
          setPhysicalChanges(changes);
          
          // Calculate category completion rates
          const categoryRates = {};
          
          // Group habits by category
          const habitsByCategory = habitsData.reduce((acc, habit) => {
            const category = habit.category || 'other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(habit);
            return acc;
          }, {});
          
          // Calculate completion rate for each category
          Object.keys(habitsByCategory).forEach(category => {
            const categoryHabits = habitsByCategory[category];
            const rates = categoryHabits.map(habit => getCompletionRate(habit));
            const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
            categoryRates[category] = avgRate;
          });
          
          setCategoryCompletionRates(categoryRates);
        }
        
        // Categorize habits by their impact areas
        const categorized = categorizeHabits(habitsData);
        setCategorizedHabits(categorized);
      } catch (error) {
        console.error('Error loading habits for projection:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user.uid, timeFrame]);
  
  // Function to get time frame in days
  const getTimeFrameDays = () => {
    switch (timeFrame) {
      case '3months': return 90;
      case '6months': return 180;
      case '1year': return 365;
      default: return 90;
    }
  };
  
  // Function to get friendly time frame name
  const getTimeFrameName = () => {
    switch (timeFrame) {
      case '3months': return '3 Months';
      case '6months': return '6 Months';
      case '1year': return '1 Year';
      default: return '3 Months';
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>
          Calculating your future projection...
        </Text>
      </View>
    );
  }
  
  // Render empty state if no habits
  if (habits.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="trending-up" size={80} color={theme.colors.disabled} />
        <Title style={styles.emptyTitle}>No Habits to Project</Title>
        <Paragraph style={styles.emptyText}>
          Add some habits to see how they might shape your future.
        </Paragraph>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('Habits')}
          style={styles.addHabitButton}
        >
          Add Habits
        </Button>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Surface style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Title style={styles.scoreTitle}>Future Me Score</Title>
          <Text style={styles.scoreHint}>Based on your current habits</Text>
        </View>
        
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreValue}>{Math.round(overallScore)}</Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
        
        <Text style={styles.scoreDescription}>
          {overallScore >= 80 ? (
            'Excellent! Your habits are setting you up for a great future.'
          ) : overallScore >= 60 ? (
            'Good job! Your habits are generally positive, with some room for improvement.'
          ) : overallScore >= 40 ? (
            'You\'re on the right track, but could benefit from more consistency.'
          ) : (
            'Your habits need more attention to positively impact your future.'
          )}
        </Text>
      </Surface>
      
      <View style={styles.timeframeContainer}>
        <Text style={styles.timeframeLabel}>Projection Timeframe:</Text>
        <View style={styles.timeframeButtons}>
          <Button 
            mode={timeFrame === '3months' ? 'contained' : 'outlined'} 
            onPress={() => setTimeFrame('3months')}
            style={styles.timeframeButton}
            compact
          >
            3 Months
          </Button>
          <Button 
            mode={timeFrame === '6months' ? 'contained' : 'outlined'} 
            onPress={() => setTimeFrame('6months')}
            style={styles.timeframeButton}
            compact
          >
            6 Months
          </Button>
          <Button 
            mode={timeFrame === '1year' ? 'contained' : 'outlined'} 
            onPress={() => setTimeFrame('1year')}
            style={styles.timeframeButton}
            compact
          >
            1 Year
          </Button>
        </View>
      </View>
      
      <Card style={styles.projectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>
            Your Projected Future in {getTimeFrameName()}
          </Title>
          <Paragraph style={styles.projectionIntro}>
            Based on your current habit consistency, here's how your future might look:
          </Paragraph>
          
          <ProjectionChart 
            habits={habits} 
            timeFrameDays={getTimeFrameDays()} 
          />
        </Card.Content>
      </Card>
      
      {/* Future Avatar Card */}
      <Card style={styles.avatarCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>
            See Your Future Self
          </Title>
          <Paragraph style={styles.projectionIntro}>
            Visualize how your habits will transform you over time.
          </Paragraph>
          
          {!userImage ? (
            <View style={styles.noAvatarContainer}>
              <Feather name="user" size={60} color={theme.colors.disabled} />
              <Text style={styles.noAvatarText}>Upload a photo to see your future self</Text>
              <Button
                mode="contained"
                onPress={() => setShowUploader(true)}
                style={styles.uploadButton}
              >
                Upload Photo
              </Button>
            </View>
          ) : (
            <>
              <FutureAvatar 
                userImage={userImage}
                timeFrameDays={getTimeFrameDays()}
                habits={habits}
                completionRate={overallScore / 100}
                categoryImpacts={categoryCompletionRates}
              />
              
              <View style={styles.avatarChangeDetails}>
                <Title style={styles.detailsTitle}>Physical Changes</Title>
                {getPhysicalChangeDescriptions(physicalChanges).map((desc, index) => (
                  <View key={index} style={styles.changeItem}>
                    <Feather name="check" size={16} color={theme.colors.success} />
                    <Text style={styles.changeText}>{desc}</Text>
                  </View>
                ))}
                
                <Button
                  mode="outlined"
                  onPress={() => setShowUploader(true)}
                  style={styles.changePhotoButton}
                >
                  Change Photo
                </Button>
              </View>
            </>
          )}
        </Card.Content>
      </Card>
      
      {/* Modal for Avatar Upload */}
      <Portal>
        <Modal
          visible={showUploader}
          onDismiss={() => setShowUploader(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <AvatarUploader 
            onImageUploaded={(imageUrl) => {
              setUserImage(imageUrl);
              setShowUploader(false);
            }} 
          />
          <Button 
            onPress={() => setShowUploader(false)}
            style={styles.closeButton}
          >
            Close
          </Button>
        </Modal>
      </Portal>
      
      {/* Category Impact Sections */}
      {Object.keys(categorizedHabits).length > 0 && Object.keys(categorizedHabits).map(category => {
        const categoryHabits = categorizedHabits[category];
        const impact = getProjectedImpact(categoryHabits, getTimeFrameDays());
        
        return (
          <Card key={category} style={styles.categoryCard}>
            <Card.Content>
              <View style={styles.categoryHeader}>
                <Feather 
                  name={getCategoryIcon(category)} 
                  size={24} 
                  color={theme.colors.primary} 
                />
                <Title style={styles.categoryTitle}>{formatCategoryName(category)}</Title>
              </View>
              
              <Paragraph style={styles.categoryDescription}>
                {getCategoryDescription(category, impact.score)}
              </Paragraph>
              
              <Divider style={styles.divider} />
              
              <View style={styles.impactItems}>
                {impact.effects.map((effect, index) => (
                  <View key={index} style={styles.impactItem}>
                    <Feather name={effect.icon} size={20} color={theme.colors.primary} />
                    <Text style={styles.impactLabel}>{effect.label}</Text>
                    <Text style={styles.impactValue}>{effect.value}</Text>
                  </View>
                ))}
              </View>
              
              <Divider style={styles.divider} />
              
              <Text style={styles.habitsInCategory}>Habits in this category:</Text>
              {categoryHabits.map(habit => (
                <Text key={habit.id} style={styles.habitItem}>
                  • {habit.name} ({Math.round(getCompletionRate(habit) * 100)}% consistent)
                </Text>
              ))}
            </Card.Content>
          </Card>
        );
      })}
      
      <Card style={styles.tipsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Tips to Improve Your Future</Title>
          
          <View style={styles.tipItem}>
            <Feather name="check-circle" size={24} color={theme.colors.success} style={styles.tipIcon} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Consistency is Key</Text>
              <Text style={styles.tipDescription}>
                Focus on maintaining consistency with your current habits rather than adding many new ones.
              </Text>
            </View>
          </View>
          
          <View style={styles.tipItem}>
            <Feather name="trending-up" size={24} color={theme.colors.primary} style={styles.tipIcon} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Start Small</Text>
              <Text style={styles.tipDescription}>
                Begin with small, achievable habits and gradually increase difficulty as they become automatic.
              </Text>
            </View>
          </View>
          
          <View style={styles.tipItem}>
            <Feather name="clock" size={24} color={theme.colors.accent} style={styles.tipIcon} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Be Patient</Text>
              <Text style={styles.tipDescription}>
                Meaningful change takes time. Stay committed and trust the process.
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

// Helper functions for category details
const getCategoryIcon = (category) => {
  const icons = {
    health: 'heart',
    fitness: 'activity',
    learning: 'book',
    career: 'briefcase',
    finance: 'dollar-sign',
    relationships: 'users',
    mindfulness: 'sun',
    productivity: 'check-square',
    other: 'grid'
  };
  
  return icons[category] || 'circle';
};

const formatCategoryName = (category) => {
  return category.charAt(0).toUpperCase() + category.slice(1);
};

const getCategoryDescription = (category, score) => {
  const descriptions = {
    health: [
      "Your current habits may lead to health issues if not improved.",
      "Your health habits are on the right track but need more consistency.",
      "Your health habits are setting you up for good long-term wellbeing."
    ],
    fitness: [
      "Your fitness level may decline without more consistent exercise habits.",
      "You're maintaining basic fitness, but could see more improvement with consistency.",
      "Your exercise habits are helping you build strength and endurance."
    ],
    learning: [
      "Your learning habits aren't frequent enough to build substantial skills.",
      "You're making steady progress in learning, but could accelerate with more practice.",
      "Your consistent learning habits will lead to mastery over time."
    ],
    career: [
      "Your career development habits need more attention to advance professionally.",
      "You're taking some steps toward career growth, but could be more strategic.",
      "Your professional habits are positioning you well for future opportunities."
    ],
    finance: [
      "Your financial habits may lead to challenges if not improved.",
      "You're on the right track financially, but have room to improve.",
      "Your financial habits are setting you up for long-term stability."
    ],
    relationships: [
      "Your relationship habits may need more attention to strengthen connections.",
      "You're maintaining your relationships, but could deepen them with more effort.",
      "Your consistent relationship habits are building strong connections."
    ],
    mindfulness: [
      "Your mindfulness practice is infrequent, limiting its benefits.",
      "You're practicing mindfulness occasionally, gaining some benefits.",
      "Your consistent mindfulness practice is improving your mental clarity."
    ],
    productivity: [
      "Your productivity habits are inconsistent, limiting your effectiveness.",
      "You have some good productivity systems that could be more consistent.",
      "Your productivity habits are helping you accomplish more with less stress."
    ],
    other: [
      "These habits need more consistency to see meaningful results.",
      "You're making progress with these habits but have room to improve.",
      "You're maintaining good consistency with these important habits."
    ]
  };
  
  // Select description based on score (0-100)
  const level = score < 40 ? 0 : score < 70 ? 1 : 2;
  return descriptions[category]?.[level] || descriptions.other[level];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  noAvatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noAvatarText: {
    marginTop: 16,
    marginBottom: 24,
    color: '#666',
    textAlign: 'center',
  },
  uploadButton: {
    marginTop: 8,
  },
  avatarChangeDetails: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  detailsTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  changeText: {
    marginLeft: 8,
  },
  changePhotoButton: {
    marginTop: 16,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  closeButton: {
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  addHabitButton: {
    marginTop: 20,
  },
  scoreCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  scoreHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreHint: {
    color: '#666',
    marginTop: 4,
  },
  scoreCircle: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#6200EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: 'row',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6200EE',
  },
  scoreMax: {
    fontSize: 16,
    color: '#666',
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  scoreDescription: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  timeframeContainer: {
    marginBottom: 16,
  },
  timeframeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timeframeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeframeButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  projectionCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  projectionIntro: {
    marginBottom: 16,
  },
  categoryCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryDescription: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  impactItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  impactItem: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  impactLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 4,
  },
  impactValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  habitsInCategory: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  habitItem: {
    marginBottom: 4,
    paddingLeft: 8,
  },
  tipsCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tipIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  tipDescription: {
    color: '#666',
  },
});

export default FutureProjectionScreen;
