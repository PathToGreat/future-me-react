import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme, ActivityIndicator, Text } from 'react-native-paper';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';

// Screen imports
import AuthScreen from '../screens/AuthScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HabitListScreen from '../screens/HabitListScreen';
import HabitDetailScreen from '../screens/HabitDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FutureProjectionScreen from '../screens/FutureProjectionScreen';

// Context
import { useAuth } from '../context/AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator (when user is authenticated)
const TabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'home';
          } else if (route.name === 'Habits') {
            iconName = 'list';
          } else if (route.name === 'Future') {
            iconName = 'trending-up';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          }

          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.placeholder,
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Today' }} />
      <Tab.Screen name="Habits" component={HabitsNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Future" component={FutureProjectionScreen} options={{ title: 'Future Me' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Habits stack navigator
const HabitsStack = createStackNavigator();

const HabitsNavigator = () => {
  const theme = useTheme();
  
  return (
    <HabitsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <HabitsStack.Screen name="HabitList" component={HabitListScreen} options={{ title: 'My Habits' }} />
      <HabitsStack.Screen 
        name="HabitDetail" 
        component={HabitDetailScreen} 
        options={({ route }) => ({ title: route.params?.habitName || 'Habit Details' })}
      />
    </HabitsStack.Navigator>
  );
};

// Main navigation container
const AppNavigator = () => {
  const { user, loading } = useAuth();
  const theme = useTheme();
  
  console.log("AppNavigator rendering:", { userExists: !!user, loadingState: loading });
  
  // Debug component to verify that rendering works
  const DebugScreen = () => (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: theme.colors.background,
      padding: 20
    }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 20 }}>
        Future Me Debug Screen
      </Text>
      <Text style={{ marginBottom: 10, color: theme.colors.text }}>
        Auth state: {loading ? 'Loading...' : (user ? 'Logged in' : 'Not logged in')}
      </Text>
      <Text style={{ marginBottom: 10, color: theme.colors.text }}>
        User: {user ? `${user.email}` : 'None'}
      </Text>
      
      <View style={{ 
        marginTop: 30, 
        padding: 15, 
        backgroundColor: theme.colors.surface, 
        borderRadius: 8, 
        width: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 10, color: theme.colors.text }}>
          Debug Actions:
        </Text>
        <Button 
          mode="outlined" 
          onPress={() => console.log("Debug button pressed")}
          style={{ marginBottom: 10 }}
        >
          Log Debug Info
        </Button>
      </View>
    </View>
  );
  
  if (loading) {
    // Return a loading indicator
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: theme.colors.text }}>Loading authentication state...</Text>
        <Text style={{ marginTop: 5, fontSize: 12, color: theme.colors.placeholder }}>
          This should only take a moment.
        </Text>
      </View>
    );
  }

  try {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="Auth" component={AuthScreen} />
          ) : (
            <Stack.Screen name="Main" component={TabNavigator} />
          )}
          {/* Debug screen that can be accessed if needed */}
          <Stack.Screen name="Debug" component={DebugScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  } catch (error) {
    console.error("Error in AppNavigator:", error);
    return <DebugScreen />;
  }
};

export default AppNavigator;
