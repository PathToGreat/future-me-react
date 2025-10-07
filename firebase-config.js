// Firebase configuration
// In a browser environment, we need to use a different approach than process.env
// The values will be filled in when the user provides their Firebase credentials
const firebaseConfig = {
  apiKey: "", // Will be provided by the user
  authDomain: "", // Will be constructed from projectId
  projectId: "", // Will be provided by the user
  storageBucket: "", // Will be constructed from projectId
  messagingSenderId: "", // Optional
  appId: "", // Will be provided by the user
};

// Function to set Firebase configuration values
function setFirebaseConfig(apiKey, projectId, appId) {
  firebaseConfig.apiKey = apiKey;
  firebaseConfig.projectId = projectId;
  firebaseConfig.authDomain = `${projectId}.firebaseapp.com`;
  firebaseConfig.storageBucket = "future-me-app-5d754.appspot.com";
  firebaseConfig.appId = appId;
}

// Initialize Firebase
function initializeFirebase() {
  // Check if Firebase is already initialized
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
  return firebase;
}

const testApp = initializeFirebase();
console.log("Firebase Initialized:", testApp.apps.length > 0);

// Authentication functions
async function loginWithEmailAndPassword(email, password) {
  try {
    const auth = firebase.auth();
    const userCredential = await auth.signInWithEmailAndPassword(
      email,
      password,
    );
    return userCredential.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

async function registerWithEmailAndPassword(email, password, displayName) {
  try {
    const auth = firebase.auth();
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password,
    );

    // Update profile with display name
    await userCredential.user.updateProfile({
      displayName: displayName,
    });

    // Create user document in Firestore
    await createUserProfile(userCredential.user.uid, {
      displayName,
      email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    return userCredential.user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

async function loginWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const auth = firebase.auth();
    const userCredential = await auth.signInWithPopup(provider);

    // Check if this is a new user (first time sign in)
    const isNewUser = userCredential.additionalUserInfo.isNewUser;

    if (isNewUser) {
      // Create user profile for new Google sign-ins
      await createUserProfile(userCredential.user.uid, {
        displayName: userCredential.user.displayName,
        email: userCredential.user.email,
        photoURL: userCredential.user.photoURL,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }

    return userCredential.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}

async function logoutUser() {
  try {
    const auth = firebase.auth();
    await auth.signOut();
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

// Firestore functions
async function createUserProfile(userId, userData) {
  try {
    const db = firebase.firestore();
    await db.collection("users").doc(userId).set(userData);
    return userData;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
}

async function getUserProfile(userId) {
  try {
    const db = firebase.firestore();
    const doc = await db.collection("users").doc(userId).get();
    if (doc.exists) {
      return doc.data();
    } else {
      throw new Error("User profile not found");
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
}

// Habit functions
async function getAllHabits(userId) {
  try {
    const db = firebase.firestore();
    const snapshot = await db
      .collection("users")
      .doc(userId)
      .collection("habits")
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting habits:", error);
    throw error;
  }
}

async function addHabit(userId, habitData) {
  try {
    const db = firebase.firestore();
    const habit = {
      ...habitData,
      streak: 0,
      completionRate: 0,
      logs: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db
      .collection("users")
      .doc(userId)
      .collection("habits")
      .add(habit);

    return {
      id: docRef.id,
      ...habit,
    };
  } catch (error) {
    console.error("Error adding habit:", error);
    throw error;
  }
}

async function updateHabit(userId, habitId, habitData) {
  try {
    const db = firebase.firestore();
    await db
      .collection("users")
      .doc(userId)
      .collection("habits")
      .doc(habitId)
      .update({
        ...habitData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

    return {
      id: habitId,
      ...habitData,
    };
  } catch (error) {
    console.error("Error updating habit:", error);
    throw error;
  }
}

async function deleteHabit(userId, habitId) {
  try {
    const db = firebase.firestore();
    await db
      .collection("users")
      .doc(userId)
      .collection("habits")
      .doc(habitId)
      .delete();

    return true;
  } catch (error) {
    console.error("Error deleting habit:", error);
    throw error;
  }
}

async function completeHabitForToday(userId, habitId) {
  try {
    const db = firebase.firestore();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    // Check if habit already completed today
    const habitRef = db
      .collection("users")
      .doc(userId)
      .collection("habits")
      .doc(habitId);

    const habitDoc = await habitRef.get();
    const habit = habitDoc.data();

    if (!habit) {
      throw new Error("Habit not found");
    }

    // Create logs array if it doesn't exist
    const logs = habit.logs || [];

    // Check if already logged today
    const todayLog = logs.find((log) => {
      const logDate =
        log.date instanceof firebase.firestore.Timestamp
          ? log.date.toDate()
          : new Date(log.date);

      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    });

    if (todayLog) {
      // Already completed today
      return habit;
    }

    // Add today's log
    logs.push({
      date: firebase.firestore.Timestamp.fromDate(today),
      completed: true,
    });

    // Update streak
    let streak = habit.streak || 0;

    // Check if yesterday was logged (for continuing streak)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayLog = logs.find((log) => {
      const logDate =
        log.date instanceof firebase.firestore.Timestamp
          ? log.date.toDate()
          : new Date(log.date);

      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === yesterday.getTime();
    });

    // If there's a yesterday log or streak is 0, increment streak
    // If streak > 0 but no yesterday log, reset streak to 1
    if (yesterdayLog || streak === 0) {
      streak += 1;
    } else {
      streak = 1;
    }

    // Calculate completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentLogs = logs.filter((log) => {
      const logDate =
        log.date instanceof firebase.firestore.Timestamp
          ? log.date.toDate()
          : new Date(log.date);

      return logDate >= thirtyDaysAgo;
    });

    // Calculate applicable days (based on frequency)
    const frequency = habit.frequency || [0, 1, 2, 3, 4, 5, 6]; // Default all days
    let applicableDays = 0;

    for (let d = 0; d < 30; d++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - d);

      if (frequency.includes(checkDate.getDay())) {
        applicableDays++;
      }
    }

    const completionRate =
      applicableDays > 0
        ? Math.round((recentLogs.length / applicableDays) * 100)
        : 0;

    // Update habit with new logs, streak, completion rate
    await habitRef.update({
      logs,
      streak,
      completionRate,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    return {
      ...habit,
      logs,
      streak,
      completionRate,
    };
  } catch (error) {
    console.error("Error completing habit:", error);
    throw error;
  }
}

// Check Firebase environment
function checkFirebaseConfig() {
  const missing = [];

  if (!firebaseConfig.apiKey) missing.push("API Key");
  if (!firebaseConfig.projectId) missing.push("Project ID");
  if (!firebaseConfig.appId) missing.push("App ID");

  if (missing.length > 0) {
    console.warn("Missing Firebase configuration: " + missing.join(", "));
    return false;
  }

  return true;
}
