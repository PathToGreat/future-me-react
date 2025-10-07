// src/config/firebase.js
import { Platform } from "react-native";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

console.log("Firebase config initializing");
console.log("Environment platform:", Platform.OS);

// Check what environment variables are available
const envVars = {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY
    ? "present"
    : "missing",
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
    ? "present"
    : "missing",
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
    ? "present"
    : "missing",
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? "present" : "missing",
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "present" : "missing",
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID ? "present" : "missing",
};

console.log("Environment variables availability:", envVars);

// Get API key and project ID with fallbacks
// First we try Expo Web environment, then Node environment, then hardcoded values
const apiKey =
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
const projectId =
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID;
const appId =
  process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID;

// Check if essential Firebase configuration is available
const hasValidConfig = apiKey && projectId && appId;

console.log(
  "Firebase configuration status:",
  hasValidConfig ? "Valid configuration found" : "Missing configuration",
);

if (!hasValidConfig) {
  console.warn(
    "Some Firebase configuration values are missing:",
    !apiKey ? "API Key is missing" : "",
    !projectId ? "Project ID is missing" : "",
    !appId ? "App ID is missing" : "",
  );
} else {
  console.log("All required Firebase configuration values are present");
}

// Firebase configuration
console.log("projectId being used:", projectId);
const firebaseConfig = {
  apiKey,
  authDomain: projectId ? `${projectId}.firebaseapp.com` : undefined,
  projectId,
  storageBucket: projectId ? `${projectId}.appspot.com` : undefined,
  appId,
};

console.log("Firebase config (with masked keys):", {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? "***" : undefined,
  appId: firebaseConfig.appId ? "***" : undefined,
});

// Initialize Firebase with fallback for testing if needed
let app, auth, db;

try {
  // Only attempt to initialize Firebase with a valid configuration
  if (hasValidConfig) {
    console.log("Attempting to initialize Firebase...");
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
  } else {
    throw new Error("Invalid Firebase configuration");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error.message);

  // Create a more robust mock implementation for development/testing
  console.warn(
    "Using mock Firebase implementation due to initialization failure",
  );

  // Mock Firebase app
  app = {
    name: "firebase-app-mock",
    options: { ...firebaseConfig },
  };

  // Mock Firebase auth with basic functionality
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback, errorCallback) => {
      // Simulate auth state changed event
      setTimeout(() => {
        try {
          callback(null);
        } catch (error) {
          console.error("Error in onAuthStateChanged callback:", error);
          if (errorCallback) errorCallback(error);
        }
      }, 100);

      // Return unsubscribe function
      return () => {
        console.log("Mock auth: unsubscribed from auth state changes");
      };
    },
    signInWithEmailAndPassword: (email, password) => {
      console.log("Mock auth: signInWithEmailAndPassword called");
      return Promise.resolve({
        user: {
          uid: "mock-user-id",
          email,
          displayName: "Mock User",
          emailVerified: true,
        },
      });
    },
    createUserWithEmailAndPassword: (email, password) => {
      console.log("Mock auth: createUserWithEmailAndPassword called");
      return Promise.resolve({
        user: {
          uid: "mock-user-id",
          email,
          displayName: null,
          emailVerified: false,
        },
      });
    },
    signOut: () => {
      console.log("Mock auth: signOut called");
      return Promise.resolve();
    },
    // Add any other auth methods you need here
  };

  // Mock Firestore with basic functionality
  db = {
    collection: (collectionName) => {
      console.log(`Mock Firestore: accessing collection ${collectionName}`);
      return {
        doc: (docId) => ({
          get: () =>
            Promise.resolve({
              exists: false,
              data: () => null,
            }),
          set: (data) => Promise.resolve(data),
          update: (data) => Promise.resolve(data),
          delete: () => Promise.resolve(),
        }),
        add: (data) => Promise.resolve({ id: "mock-doc-id" }),
        where: () => ({
          get: () =>
            Promise.resolve({
              empty: true,
              docs: [],
            }),
        }),
      };
    },
  };
}

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    console.log("Attempting Google sign-in...");
    if (Platform.OS === "web") {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log("Google sign-in successful");
      return result;
    } else {
      console.error("Google sign-in is only supported on web for this demo");
      throw new Error("Google sign-in is only supported on web for this demo");
    }
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const registerWithEmail = async (email, password) => {
  try {
    console.log("Attempting email registration...");
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Email registration successful");
    return result;
  } catch (error) {
    console.error("Email registration error:", error);
    throw error;
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    console.log("Attempting email login...");
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log("Email login successful");
    return result;
  } catch (error) {
    console.error("Email login error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    console.log("Attempting logout...");
    await signOut(auth);
    console.log("Logout successful");
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

// Export the initialized services
export { app, auth, db, onAuthStateChanged };
