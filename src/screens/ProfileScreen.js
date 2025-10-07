import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Avatar,
  Title,
  Button,
  Divider,
  List,
  useTheme,
  TextInput,
  Dialog,
  Portal,
  ActivityIndicator,
  Surface,
} from "react-native-paper";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../config/firebase";
import { updateUserProfile } from "../services/userService";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../config/firebase";

const ProfileScreen = () => {
  const theme = useTheme();
  const { user, userProfile, updateUserProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || "",
    photoURL: userProfile?.photoURL || "",
  });
  const [notifications, setNotifications] = useState(
    userProfile?.settings?.notifications || true,
  );
  const [darkMode, setDarkMode] = useState(
    userProfile?.settings?.theme === "dark",
  );

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      await logoutUser();
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);

      // Check if display name is empty
      if (!formData.displayName.trim()) {
        Alert.alert("Error", "Display name cannot be empty");
        setLoading(false);
        return;
      }

      await updateUserProfile({
        displayName: formData.displayName,
        photoURL: formData.photoURL,
      });

      setEditMode(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle notifications toggle
  const toggleNotifications = async () => {
    try {
      const newValue = !notifications;
      setNotifications(newValue);

      await updateUserProfile({
        settings: {
          ...userProfile.settings,
          notifications: newValue,
        },
      });
    } catch (error) {
      console.error("Error updating notifications setting:", error);
      // Revert the toggle if it fails
      setNotifications(!newValue);
      Alert.alert("Error", "Failed to update notification settings");
    }
  };

  // Handle theme toggle
  const toggleTheme = async () => {
    try {
      const newValue = !darkMode;
      setDarkMode(newValue);

      await updateUserProfile({
        settings: {
          ...userProfile.settings,
          theme: newValue ? "dark" : "light",
        },
      });
    } catch (error) {
      console.error("Error updating theme setting:", error);
      // Revert the toggle if it fails
      setDarkMode(!newValue);
      Alert.alert("Error", "Failed to update theme settings");
    }
  };

  // Upload image to Firebase Storage and return its URL
  const uploadImageToFirebase = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `profilePictures/${user.uid}_${Date.now()}.jpg`;

      const storage = getStorage(app);
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Upload Failed", "There was an issue uploading your image.");
      return null;
    }
  };

  // Handle image selection
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        const localUri = result.assets[0].uri;
        setLoading(true);

        // Upload to Firebase
        const downloadURL = await uploadImageToFirebase(localUri);
        if (downloadURL) {
          setFormData({
            ...formData,
            photoURL: downloadURL,
          });

          // Update Firestore user profile with new photo
          await updateUserProfile({ photoURL: downloadURL });
        }
      }
    } catch (error) {
      console.error("Error picking or uploading image:", error);
      Alert.alert("Error", "Failed to select or upload image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Surface style={styles.header}>
        <View style={styles.profileHeader}>
          {editMode ? (
            <TouchableOpacity onPress={pickImage}>
              <Avatar.Image
                size={100}
                source={{
                  uri:
                    formData.photoURL ||
                    "https://ui-avatars.com/api/?name=Future+Me&background=6200EE&color=fff",
                }}
              />
              <View
                style={[
                  styles.editAvatarBadge,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Feather name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
          ) : (
            <Avatar.Image
              size={100}
              source={{
                uri:
                  userProfile?.photoURL ||
                  "https://ui-avatars.com/api/?name=Future+Me&background=6200EE&color=fff",
              }}
            />
          )}

          {editMode ? (
            <TextInput
              label="Display Name"
              value={formData.displayName}
              onChangeText={(text) =>
                setFormData({ ...formData, displayName: text })
              }
              mode="outlined"
              style={styles.nameInput}
            />
          ) : (
            <Title style={styles.displayName}>
              {userProfile?.displayName || "User"}
            </Title>
          )}

          <Text style={styles.email}>{user?.email}</Text>

          {editMode ? (
            <View style={styles.editActions}>
              <Button
                mode="outlined"
                onPress={() => setEditMode(false)}
                style={styles.editButton}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleUpdateProfile}
                style={styles.editButton}
                loading={loading}
                disabled={loading}
              >
                Save
              </Button>
            </View>
          ) : (
            <Button
              mode="outlined"
              onPress={() => setEditMode(true)}
              icon="pencil"
              style={styles.editProfileButton}
            >
              Edit Profile
            </Button>
          )}
        </View>
      </Surface>

      {/* Settings Section */}
      <Surface style={styles.section}>
        <Title style={styles.sectionTitle}>Settings</Title>

        <List.Item
          title="Notifications"
          description="Receive reminders for your habits"
          left={() => <List.Icon icon="bell" />}
          right={() => (
            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
              color={theme.colors.primary}
            />
          )}
        />

        <Divider />

        <List.Item
          title="Dark Mode"
          description="Toggle dark theme"
          left={() => <List.Icon icon="moon" />}
          right={() => (
            <Switch
              value={darkMode}
              onValueChange={toggleTheme}
              color={theme.colors.primary}
            />
          )}
        />

        <Divider />

        <List.Item
          title="Data Export"
          description="Export your habit data"
          left={() => <List.Icon icon="download" />}
          onPress={() =>
            Alert.alert(
              "Coming Soon",
              "This feature will be available in a future update.",
            )
          }
        />
      </Surface>

      {/* About Section */}
      <Surface style={styles.section}>
        <Title style={styles.sectionTitle}>About</Title>

        <List.Item
          title="Privacy Policy"
          left={() => <List.Icon icon="shield" />}
          onPress={() => {
            /* Navigate to privacy policy */
          }}
        />

        <Divider />

        <List.Item
          title="Terms of Service"
          left={() => <List.Icon icon="file-document" />}
          onPress={() => {
            /* Navigate to terms of service */
          }}
        />

        <Divider />

        <List.Item
          title="App Version"
          description="1.0.0"
          left={() => <List.Icon icon="information" />}
        />
      </Surface>

      {/* Logout Button */}
      <Button
        mode="outlined"
        onPress={handleLogout}
        icon="logout"
        style={styles.logoutButton}
        loading={loading}
        disabled={loading}
        color={theme.colors.error}
      >
        Log Out
      </Button>

      {/* Loading Dialog */}
      <Portal>
        <Dialog visible={loading} dismissable={false}>
          <Dialog.Content style={styles.loadingDialog}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Please wait...</Text>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  header: {
    padding: 20,
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    elevation: 2,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 20,
  },
  displayName: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },
  email: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  editProfileButton: {
    marginTop: 20,
  },
  nameInput: {
    width: "80%",
    marginTop: 16,
  },
  editAvatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  editActions: {
    flexDirection: "row",
    marginTop: 20,
  },
  editButton: {
    marginHorizontal: 10,
  },
  section: {
    padding: 20,
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  logoutButton: {
    margin: 20,
    marginBottom: 40,
    borderColor: "red",
  },
  loadingDialog: {
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default ProfileScreen;
