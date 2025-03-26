import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { 
  updateProfile as updateFirebaseProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';

/**
 * Get user profile from Firestore
 * @param {String} userId - The user ID
 * @returns {Promise<Object>} User profile object
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      // User doesn't exist in Firestore, create a new profile
      return createUserProfile(userId);
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Create a new user profile in Firestore
 * @param {String} userId - The user ID
 * @returns {Promise<Object>} Created user profile object
 */
export const createUserProfile = async (userId) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }
    
    const newProfile = {
      uid: userId,
      email: currentUser.email,
      displayName: currentUser.displayName || '',
      photoURL: currentUser.photoURL || '',
      createdAt: new Date().toISOString(),
      settings: {
        theme: 'light',
        notifications: true,
      }
    };
    
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, newProfile);
    
    return newProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Update user profile in Firestore and Firebase Auth
 * @param {String} userId - The user ID
 * @param {Object} profileData - The updated profile data
 * @returns {Promise<Object>} Updated user profile object
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Update with timestamps
    const updatedData = {
      ...profileData,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(userRef, updatedData);
    
    // If display name or photo URL is updated, also update in Firebase Auth
    const currentUser = auth.currentUser;
    if (currentUser && (profileData.displayName || profileData.photoURL)) {
      await updateFirebaseProfile(currentUser, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL
      });
    }
    
    // Get the updated user profile
    const updatedProfile = await getDoc(userRef);
    return updatedProfile.data();
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Update user email in Firebase Auth and Firestore
 * @param {String} password - Current password for verification
 * @param {String} newEmail - The new email address
 * @returns {Promise<void>}
 */
export const updateUserEmail = async (password, newEmail) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }
    
    // Re-authenticate the user before updating email
    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
    
    // Update email in Firebase Auth
    await updateEmail(currentUser, newEmail);
    
    // Update email in Firestore
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      email: newEmail,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user email:', error);
    throw error;
  }
};

/**
 * Update user password in Firebase Auth
 * @param {String} currentPassword - Current password for verification
 * @param {String} newPassword - The new password
 * @returns {Promise<void>}
 */
export const updateUserPassword = async (currentPassword, newPassword) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }
    
    // Re-authenticate the user before updating password
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    
    // Update password in Firebase Auth
    await updatePassword(currentUser, newPassword);
    
    // Update lastPasswordChange in Firestore
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      lastPasswordChanged: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user password:', error);
    throw error;
  }
};

/**
 * Add a notification to the user's notifications list
 * @param {String} userId - The user ID
 * @param {Object} notification - The notification object
 * @returns {Promise<void>}
 */
export const addUserNotification = async (userId, notification) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Create notification object with timestamp
    const newNotification = {
      ...notification,
      timestamp: new Date().toISOString(),
      read: false,
      id: Math.random().toString(36).substr(2, 9) // Generate a random ID
    };
    
    // Add to the notifications array
    await updateDoc(userRef, {
      notifications: arrayUnion(newNotification)
    });
  } catch (error) {
    console.error('Error adding user notification:', error);
    throw error;
  }
};

/**
 * Get user's notifications
 * @param {String} userId - The user ID
 * @returns {Promise<Array>} Array of notification objects
 */
export const getUserNotifications = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data().notifications || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

/**
 * Update notification status (mark as read)
 * @param {String} userId - The user ID
 * @param {String} notificationId - The notification ID
 * @returns {Promise<void>}
 */
export const markNotificationAsRead = async (userId, notificationId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const notifications = userData.notifications || [];
      
      // Find and update the notification
      const updatedNotifications = notifications.map(notification => {
        if (notification.id === notificationId) {
          return { ...notification, read: true };
        }
        return notification;
      });
      
      // Update the user document
      await updateDoc(userRef, { notifications: updatedNotifications });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Update user settings
 * @param {String} userId - The user ID
 * @param {Object} settings - The updated settings
 * @returns {Promise<void>}
 */
export const updateUserSettings = async (userId, settings) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      settings,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};
