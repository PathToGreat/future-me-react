import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  SafeAreaView,
  ImageBackground,
  Dimensions,
} from "react-native";
import { CATEGORIES, preloadedHabits } from "./src/utils/preloadedHabits";
import { app, auth, db } from "./src/config/firebase";

/**
 * Future Me App Component - Investor Preview Version
 * Showcases the core concepts and features for investor presentations
 */
export default function App() {
  // State variables
  const [activeTab, setActiveTab] = useState("future"); // Default to future projection tab
  const [selectedTimeframe, setSelectedTimeframe] = useState(90); // Default 3 months projection
  const [categories, setCategories] = useState(Object.values(CATEGORIES));
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [habitsToShow, setHabitsToShow] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [completionRate, setCompletionRate] = useState(0.75); // Mock completion rate for demo purposes
  useEffect(() => {
    console.log("Firebase app initialized:", app ? "Yes" : "No");
    console.log("Auth object exists:", auth ? "Yes" : "No");
    console.log("Firestore object exists:", db ? "Yes" : "No");
  }, []);
  // Avatar images for demonstration
  const currentAvatarUrl =
    "https://images.unsplash.com/photo-1615544983151-5fea32cb8584?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=1080&ixid=MnwxfDB8MXxyYW5kb218MHx8cGVyc29ufHx8fHx8MTcxMzc1MjIyNg&ixlib=rb-4.0.3&q=80&w=720";
  const futureAvatarUrl =
    "https://images.unsplash.com/photo-1615544983151-5fea32cb8584?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=1080&ixid=MnwxfDB8MXxyYW5kb218MHx8cGVyc29ufHx8fHx8MTcxMzc1MjIyNg&ixlib=rb-4.0.3&q=80&w=690";

  // Get formatted timeframe label
  const getTimeframeLabel = (days) => {
    if (days === 30) return "1 Month";
    if (days === 90) return "3 Months";
    if (days === 180) return "6 Months";
    if (days === 270) return "9 Months";
    if (days === 365) return "1 Year";
    if (days === 1095) return "3 Years";
    if (days === 1825) return "5 Years";
    return `${days} Days`;
  };

  // Set initial category and check auth status when component mounts
  useEffect(() => {
    console.log("App component mounted on platform:", Platform.OS);

    // Set initial category
    if (categories.length > 0) {
      setSelectedCategory(categories[0]);
    }

    // Check authentication status
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
      console.log("Auth state changed, user logged in:", !!user);
    });

    setIsLoaded(true);

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Update habits when selected category changes
  useEffect(() => {
    if (selectedCategory) {
      console.log("Selected category:", selectedCategory);
      const filteredHabits = preloadedHabits.filter(
        (habit) => habit.category === selectedCategory,
      );
      setHabitsToShow(filteredHabits);
    }
  }, [selectedCategory]);

  // Get color by category
  const getCategoryColor = (category) => {
    if (category === CATEGORIES.HEALTH) return "#4CAF50";
    if (category === CATEGORIES.FITNESS) return "#2196F3";
    if (category === CATEGORIES.SOCIAL) return "#E91E63";
    if (category === CATEGORIES.MENTAL) return "#9C27B0";
    if (category === CATEGORIES.SPIRITUAL) return "#673AB7";
    if (category === CATEGORIES.FINANCIAL) return "#FFC107";
    return "#6200EE"; // Default primary color
  };

  // Render a category button
  const renderCategoryButton = (category) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category && {
          backgroundColor: getCategoryColor(category),
        },
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text
        style={[
          styles.categoryButtonText,
          selectedCategory === category && styles.selectedCategoryText,
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );

  // Render projected changes based on habits
  const renderProjectedChanges = () => {
    // Sample changes for demonstration
    const changes = [
      { type: "health", text: "Improved cardiovascular health", icon: "♥️" },
      { type: "fitness", text: "5-10% increase in muscle tone", icon: "💪" },
      {
        type: "health",
        text: "Better skin elasticity and complexion",
        icon: "✨",
      },
      { type: "mental", text: "Reduced physical signs of stress", icon: "😌" },
    ];

    return (
      <View style={styles.changesContainer}>
        <Text style={styles.changesTitle}>Expected Physical Changes</Text>
        <View style={styles.changesList}>
          {changes.map((change, index) => (
            <View
              key={index}
              style={[styles.changeItem, styles[`${change.type}Change`]]}
            >
              <View
                style={[
                  styles.changeIcon,
                  {
                    backgroundColor: getCategoryColor(
                      change.type === "health"
                        ? CATEGORIES.HEALTH
                        : change.type === "fitness"
                          ? CATEGORIES.FITNESS
                          : CATEGORIES.MENTAL,
                    ),
                  },
                ]}
              >
                <Text style={styles.changeIconText}>{change.icon}</Text>
              </View>
              <Text style={styles.changeText}>{change.text}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render avatar transformation section
  const renderFutureProjection = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Your Future Avatar</Text>
        <Text style={styles.sectionDescription}>
          Based on your habit consistency, here's a visualization of how you
          might look over time:
        </Text>

        {/* Timeframe selection */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.timeframeContainer}
        >
          {[30, 90, 180, 270, 365, 1095, 1825].map((days) => (
            <TouchableOpacity
              key={days}
              style={[
                styles.timeframeButton,
                selectedTimeframe === days && styles.timeframeButtonActive,
              ]}
              onPress={() => setSelectedTimeframe(days)}
            >
              <Text
                style={[
                  styles.timeframeButtonText,
                  selectedTimeframe === days &&
                    styles.timeframeButtonTextActive,
                ]}
              >
                {getTimeframeLabel(days)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Avatar comparison */}
        <View style={styles.avatarComparisonContainer}>
          <View style={styles.avatarColumn}>
            <Text style={styles.avatarLabel}>Current You</Text>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: currentAvatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
          </View>

          <View style={styles.avatarColumn}>
            <Text style={styles.avatarLabel}>
              Future You ({getTimeframeLabel(selectedTimeframe)})
            </Text>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: futureAvatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
              <View
                style={[
                  styles.avatarGlow,
                  {
                    backgroundColor: `rgba(98, 0, 238, ${0.3 * completionRate})`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Projected changes */}
        {renderProjectedChanges()}
      </View>
    </ScrollView>
  );

  // Render habits section
  const renderHabits = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>My Habits</Text>
        <Text style={styles.sectionDescription}>
          Track your progress with these key habits to transform your future
          self:
        </Text>

        {/* Category filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map((category) => renderCategoryButton(category))}
        </ScrollView>

        {/* Habits list */}
        <View style={styles.habitsList}>
          {habitsToShow.map((habit, index) => (
            <View key={index} style={styles.habitCard}>
              <View style={styles.habitContent}>
                <Text style={styles.habitTitle}>{habit.title}</Text>
                <Text style={styles.habitDescription}>{habit.description}</Text>
                <Text style={styles.habitFact}>{habit.factDescription}</Text>
              </View>
              <View
                style={[
                  styles.habitCompletionCircle,
                  {
                    backgroundColor: `rgba(${index % 3 === 0 ? "76, 175, 80" : index % 3 === 1 ? "33, 150, 243" : "233, 30, 99"}, 0.2)`,
                    borderColor:
                      index % 3 === 0
                        ? "#4CAF50"
                        : index % 3 === 1
                          ? "#2196F3"
                          : "#E91E63",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.habitCompletionText,
                    {
                      color:
                        index % 3 === 0
                          ? "#4CAF50"
                          : index % 3 === 1
                            ? "#2196F3"
                            : "#E91E63",
                    },
                  ]}
                >
                  {Math.floor(Math.random() * 40) + 60}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // Render dashboard tab
  const renderDashboard = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Daily Check-in</Text>
        <Text style={styles.sectionDescription}>
          Track your progress and build momentum with consistent daily check-ins
        </Text>

        {/* Today's stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>5/8</Text>
            <Text style={styles.statLabel}>Today's Habits</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>75%</Text>
            <Text style={styles.statLabel}>Weekly Average</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>18</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Quick habit completion */}
        <View style={styles.quickHabitsContainer}>
          <Text style={styles.quickHabitsTitle}>Quick Complete</Text>

          {preloadedHabits.slice(0, 5).map((habit, index) => (
            <View key={index} style={styles.quickHabitItem}>
              <View
                style={[
                  styles.checkboxContainer,
                  index < 3 && styles.checkboxChecked,
                ]}
              >
                <Text
                  style={[
                    styles.checkboxIcon,
                    index < 3 && styles.checkboxIconChecked,
                  ]}
                >
                  {index < 3 ? "✓" : ""}
                </Text>
              </View>
              <View style={styles.quickHabitDetails}>
                <Text style={styles.quickHabitTitle}>{habit.title}</Text>
                <Text style={styles.quickHabitDescription}>
                  {habit.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // Render profile tab
  const renderProfile = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.profileContainer}>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: currentAvatarUrl }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Alex Johnson</Text>
            <Text style={styles.profileEmail}>alex@example.com</Text>
            <TouchableOpacity style={styles.editProfileButton}>
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsOverview}>
          <View style={styles.statOverviewItem}>
            <Text style={styles.statOverviewValue}>35</Text>
            <Text style={styles.statOverviewLabel}>Habits</Text>
          </View>
          <View style={styles.statOverviewItem}>
            <Text style={styles.statOverviewValue}>18</Text>
            <Text style={styles.statOverviewLabel}>Day Streak</Text>
          </View>
          <View style={styles.statOverviewItem}>
            <Text style={styles.statOverviewValue}>75%</Text>
            <Text style={styles.statOverviewLabel}>Completion</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemIcon}>⚙️</Text>
            <Text style={styles.menuItemText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemIcon}>🔔</Text>
            <Text style={styles.menuItemText}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemIcon}>📊</Text>
            <Text style={styles.menuItemText}>Statistics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemIcon}>🔒</Text>
            <Text style={styles.menuItemText}>Privacy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemIcon}>❓</Text>
            <Text style={styles.menuItemText}>Help & Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemIcon}>📱</Text>
            <Text style={styles.menuItemText}>App Version 1.0.0</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => auth.signOut().then(() => setIsLoggedIn(false))}
        >
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "habits":
        return renderHabits();
      case "future":
        return renderFutureProjection();
      case "profile":
        return renderProfile();
      default:
        return renderFutureProjection();
    }
  };

  // Loading state
  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Future Me...</Text>
      </View>
    );
  }

  // Main app render
  return (
    <SafeAreaView style={styles.container}>
      {/* App header */}
      <View style={styles.header}>
        <Text style={styles.title}>Future Me</Text>
        <Text style={styles.subtitle}>Preview for Investors</Text>
      </View>

      {/* Tab content */}
      {renderTabContent()}

      {/* Bottom navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === "dashboard" && styles.navItemActive,
          ]}
          onPress={() => setActiveTab("dashboard")}
        >
          <Text style={styles.navIcon}>📋</Text>
          <Text
            style={[
              styles.navText,
              activeTab === "dashboard" && styles.navTextActive,
            ]}
          >
            Daily
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === "habits" && styles.navItemActive,
          ]}
          onPress={() => setActiveTab("habits")}
        >
          <Text style={styles.navIcon}>🔄</Text>
          <Text
            style={[
              styles.navText,
              activeTab === "habits" && styles.navTextActive,
            ]}
          >
            Habits
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === "future" && styles.navItemActive,
          ]}
          onPress={() => setActiveTab("future")}
        >
          <Text style={styles.navIcon}>🔮</Text>
          <Text
            style={[
              styles.navText,
              activeTab === "future" && styles.navTextActive,
            ]}
          >
            Future
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === "profile" && styles.navItemActive,
          ]}
          onPress={() => setActiveTab("profile")}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text
            style={[
              styles.navText,
              activeTab === "profile" && styles.navTextActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#666",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6200EE",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },

  // Tab content
  tabContent: {
    flex: 1,
    marginBottom: 60, // Space for bottom nav
  },
  sectionContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
  },

  // Categories
  categoriesContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#333",
  },
  selectedCategoryText: {
    color: "white",
  },

  // Habits list
  habitsList: {
    marginTop: 10,
  },
  habitCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  habitContent: {
    flex: 1,
    marginRight: 10,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  habitFact: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
  habitCompletionCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  habitCompletionText: {
    fontSize: 14,
    fontWeight: "bold",
  },

  // Bottom navigation
  bottomNav: {
    flexDirection: "row",
    height: 60,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  navItemActive: {
    borderTopWidth: 3,
    borderTopColor: "#6200EE",
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  navText: {
    fontSize: 12,
    color: "#666",
  },
  navTextActive: {
    color: "#6200EE",
    fontWeight: "bold",
  },

  // Future projection section
  timeframeContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  timeframeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
  },
  timeframeButtonActive: {
    backgroundColor: "#6200EE",
  },
  timeframeButtonText: {
    fontSize: 14,
    color: "#333",
  },
  timeframeButtonTextActive: {
    color: "white",
  },
  avatarComparisonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  avatarColumn: {
    alignItems: "center",
    width: "48%",
  },
  avatarLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  avatarWrapper: {
    width: "100%",
    aspectRatio: 0.7,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    borderWidth: 3,
    borderColor: "#ccc",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(98, 0, 238, 0.3)",
  },

  // Projected changes
  changesContainer: {
    marginTop: 20,
  },
  changesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  changesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  changeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(98, 0, 238, 0.1)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    width: "48%",
  },
  changeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6200EE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  changeIconText: {
    fontSize: 16,
    color: "white",
  },
  changeText: {
    flex: 1,
    fontSize: 12,
    color: "#333",
  },

  // Dashboard
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    width: "31%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6200EE",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  quickHabitsContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickHabitsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
  quickHabitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#6200EE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  checkboxChecked: {
    backgroundColor: "#6200EE",
  },
  checkboxIcon: {
    color: "transparent",
    fontSize: 16,
    fontWeight: "bold",
  },
  checkboxIconChecked: {
    color: "white",
  },
  quickHabitDetails: {
    flex: 1,
  },
  quickHabitTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 3,
  },
  quickHabitDescription: {
    fontSize: 12,
    color: "#666",
  },

  // Profile
  profileContainer: {
    padding: 15,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    marginRight: 20,
    borderWidth: 3,
    borderColor: "#6200EE",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  editProfileButton: {
    backgroundColor: "#6200EE",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignSelf: "flex-start",
  },
  editProfileButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  statsOverview: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statOverviewItem: {
    alignItems: "center",
    width: "33%",
  },
  statOverviewValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6200EE",
    marginBottom: 5,
  },
  statOverviewLabel: {
    fontSize: 12,
    color: "#666",
  },
  menuSection: {
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemIcon: {
    fontSize: 20,
    width: 30,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
  },
  logoutButton: {
    backgroundColor: "#ff5252",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
