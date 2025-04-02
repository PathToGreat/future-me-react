import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Animated, Platform, Text } from 'react-native';
import { Surface, useTheme } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * FutureAvatar Component
 * 
 * This component renders a future version of the user based on their habit progress.
 * It transforms the user's uploaded image according to the impacts of their habits.
 * 
 * @param {Object} props
 * @param {String} props.userImage - URI of the user's uploaded image
 * @param {Number} props.timeFrameDays - Number of days to project into future
 * @param {Array} props.habits - User's habits
 * @param {Number} props.completionRate - Average completion rate of habits (0-1)
 * @param {Object} props.categoryImpacts - Impact scores by category
 */
const FutureAvatar = ({ 
  userImage, 
  timeFrameDays = 90, 
  habits = [], 
  completionRate = 0,
  categoryImpacts = {}
}) => {
  const theme = useTheme();
  const [futureImage, setFutureImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pulseAnim = new Animated.Value(0);
  
  // Start pulsing animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  // Generate future avatar when inputs change
  useEffect(() => {
    const generateFutureAvatar = async () => {
      try {
        setLoading(true);
        
        if (!userImage) {
          // If no user image, return to default silhouette
          setFutureImage(null);
          return;
        }
        
        // Calculate transformation intensity based on habits and timeframe
        // Longer timeframe = more dramatic changes
        const timeIntensity = Math.min(1, timeFrameDays / 365);
        
        // Overall effect multiplier based on habit completion
        const effectMultiplier = completionRate * timeIntensity;
        
        // Apply transformations to create future image
        const operations = [];
        
        // Health & Fitness impacts
        const healthImpact = categoryImpacts.health || 0;
        const fitnessImpact = categoryImpacts.fitness || 0;
        
        // Simulate physical changes from health/fitness habits
        // For example, slimming effect if health + fitness completion is good
        if (healthImpact > 0.5 || fitnessImpact > 0.5) {
          // Add positive transformations (e.g., slimming effect)
          operations.push({ 
            resize: { 
              width: Math.round(100 - (10 * effectMultiplier)),
              height: undefined 
            }
          });
        }
        
        // If we have operations to perform and a valid image, apply them
        if (operations.length > 0) {
          const manipResult = await ImageManipulator.manipulateAsync(
            userImage,
            operations,
            { format: 'jpeg' }
          );
          setFutureImage(manipResult.uri);
        } else {
          // Just use the original image if no transformations
          setFutureImage(userImage);
        }
      } catch (err) {
        console.error('Error generating future avatar:', err);
        setError('Could not generate future avatar');
        setFutureImage(null);
      } finally {
        setLoading(false);
      }
    };
    
    generateFutureAvatar();
  }, [userImage, timeFrameDays, habits, completionRate, categoryImpacts]);
  
  // Avatar glow effect based on overall health/wellness score
  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.6],
  });
  
  // Calculate glow color based on health impacts
  const getGlowColor = () => {
    const healthScore = categoryImpacts.health || 0;
    const fitnessScore = categoryImpacts.fitness || 0;
    const mentalScore = categoryImpacts.mental || 0;
    
    const overallScore = (healthScore + fitnessScore + mentalScore) / 3;
    
    if (overallScore > 0.7) return theme.colors.success; // Excellent health
    if (overallScore > 0.4) return theme.colors.primary; // Good health
    return theme.colors.warning; // Needs improvement
  };
  
  if (loading) {
    return (
      <Surface style={styles.container}>
        <View style={styles.loadingContainer}>
          <Feather name="loader" size={40} color={theme.colors.primary} />
          <Text style={styles.loadingText}>Generating future you...</Text>
        </View>
      </Surface>
    );
  }
  
  if (error) {
    return (
      <Surface style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={40} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </Surface>
    );
  }
  
  return (
    <Surface style={styles.container}>
      <Text style={styles.dateLabel}>
        {timeFrameDays === 30 ? '1 Month From Now' : 
         timeFrameDays === 90 ? '3 Months From Now' :
         timeFrameDays === 180 ? '6 Months From Now' : '1 Year From Now'}
      </Text>
      
      <View style={styles.avatarContainer}>
        {/* Avatar background glow effect */}
        <Animated.View 
          style={[
            styles.avatarGlow,
            { 
              opacity: glowOpacity,
              backgroundColor: getGlowColor(),
            }
          ]} 
        />
        
        {futureImage ? (
          <Image 
            source={{ uri: futureImage }} 
            style={styles.avatarImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.silhouetteContainer}>
            <View style={[styles.silhouette, { backgroundColor: theme.colors.primary }]} />
          </View>
        )}
        
        {/* Show indicators of physical changes */}
        {futureImage && (
          <View style={styles.changeIndicators}>
            {completionRate > 0.7 && (
              <View style={styles.indicator}>
                <Feather name="trending-up" size={16} color={theme.colors.success} />
                <Text style={[styles.indicatorText, { color: theme.colors.success }]}>
                  Improved
                </Text>
              </View>
            )}
            
            {completionRate < 0.3 && (
              <View style={styles.indicator}>
                <Feather name="trending-down" size={16} color={theme.colors.error} />
                <Text style={[styles.indicatorText, { color: theme.colors.error }]}>
                  Declining
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
      
      <Text style={styles.avatarLabel}>Future You</Text>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 15,
    elevation: 4,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  avatarContainer: {
    width: 140,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  silhouetteContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  silhouette: {
    width: 100,
    height: 180,
    borderRadius: 8,
    // Using mask CSS property on Web for silhouette
    ...(Platform.OS === 'web' && {
      mask: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 220'%3E%3Cpath d='M80,15 C92,15 102,25 102,40 C102,51 98,60 98,65 L98,75 C101,75 103,78 103,81 C103,84 102,87 100,89 C100,89 109,93 109,105 C109,110 107,115 100,120 L100,125 C100,130 90,145 90,145 L95,150 C95,170 95,180 95,195 L95,210 C94,212 92,215 90,215 L70,215 C68,215 66,212 65,210 L65,195 C65,180 65,170 65,150 L70,145 C70,145 60,130 60,125 L60,120 C53,115 51,110 51,105 C51,93 60,89 60,89 C58,87 57,84 57,81 C57,78 59,75 62,75 L62,65 C62,60 58,51 58,40 C58,25 68,15 80,15 Z M100,87 L105,87 C105,87 114,89 119,84 C124,79 124,79 124,79 L125,85 C125,87 123,93 118,95 C113,97 110,95 110,95 L100,87 Z M60,87 L55,87 C55,87 46,89 41,84 C36,79 36,79 36,79 L35,85 C35,87 37,93 42,95 C47,97 50,95 50,95 L60,87 Z'/%3E%3C/svg%3E\") no-repeat center center",
      WebkitMask: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 220'%3E%3Cpath d='M80,15 C92,15 102,25 102,40 C102,51 98,60 98,65 L98,75 C101,75 103,78 103,81 C103,84 102,87 100,89 C100,89 109,93 109,105 C109,110 107,115 100,120 L100,125 C100,130 90,145 90,145 L95,150 C95,170 95,180 95,195 L95,210 C94,212 92,215 90,215 L70,215 C68,215 66,212 65,210 L65,195 C65,180 65,170 65,150 L70,145 C70,145 60,130 60,125 L60,120 C53,115 51,110 51,105 C51,93 60,89 60,89 C58,87 57,84 57,81 C57,78 59,75 62,75 L62,65 C62,60 58,51 58,40 C58,25 68,15 80,15 Z M100,87 L105,87 C105,87 114,89 119,84 C124,79 124,79 124,79 L125,85 C125,87 123,93 118,95 C113,97 110,95 110,95 L100,87 Z M60,87 L55,87 C55,87 46,89 41,84 C36,79 36,79 36,79 L35,85 C35,87 37,93 42,95 C47,97 50,95 50,95 L60,87 Z'/%3E%3C/svg%3E\") no-repeat center center",
    }),
  },
  changeIndicators: {
    position: 'absolute',
    bottom: 5,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginHorizontal: 3,
  },
  indicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  avatarLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    textAlign: 'center',
  },
  loadingContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: 'red',
  },
});

export default FutureAvatar;