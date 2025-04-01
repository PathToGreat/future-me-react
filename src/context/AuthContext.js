import React, { createContext, useState, useEffect, useContext } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { 
  auth, 
  db, 
  onAuthStateChanged,
  signInWithGoogle as firebaseSignInWithGoogle,
  loginWithEmail as firebaseLoginWithEmail,
  registerWithEmail as firebaseRegisterWithEmail,
  logoutUser as firebaseLogout
} from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Debug mounting of the provider
  useEffect(() => {
    console.log('Auth provider mounted');
    
    // Check if Firebase auth object is properly initialized
    if (auth) {
      console.log('Firebase auth is available:', !!auth);
      console.log('Current auth implementation:', 
        typeof auth.onAuthStateChanged === 'function' ? 'Standard' : 'Mock');
    } else {
      console.error('Firebase auth is not available!');
      setAuthError(new Error('Firebase authentication is not properly initialized'));
    }
    
    return () => {
      console.log('Auth provider unmounted');
    }
  }, []);

  // Set up auth state listener
  useEffect(() => {
    let isMounted = true;
    
    try {
      console.log('Setting up auth state listener...');
      
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        console.log('Auth state changed, user:', !!currentUser);
        
        if (!isMounted) {
          console.log('Ignoring auth state change - component unmounted');
          return;
        }
        
        if (currentUser) {
          console.log('User authenticated:', {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || 'Not set',
            emailVerified: currentUser.emailVerified
          });
          
          // For now, just use the user object as the profile
          // Will implement Firestore user profiles when database is working
          const simpleProfile = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || '',
            createdAt: new Date().toISOString(),
            settings: {
              theme: 'light',
              notifications: true,
            }
          };
          
          setUser(currentUser);
          setUserProfile(simpleProfile);
          console.log('User profile set');
        } else {
          console.log('No authenticated user');
          setUser(null);
          setUserProfile(null);
        }
        
        // Clear any auth errors when auth state changes
        setAuthError(null);
        setLoading(false);
      }, (error) => {
        // This is the error handler for onAuthStateChanged
        console.error('Auth state change error:', error);
        setAuthError(error);
        setLoading(false);
      });
      
      // Return cleanup function
      return () => {
        console.log('Cleaning up auth state listener');
        isMounted = false;
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
      setAuthError(error);
      setLoading(false);
      return () => { isMounted = false; };
    }
  }, []);

  const updateUserProfile = async (data) => {
    if (!user) return null;
    
    try {
      // For now, just update the local state
      // Will implement Firestore updates when database is working
      const updatedProfile = { ...userProfile, ...data, updatedAt: new Date().toISOString() };
      setUserProfile(updatedProfile);
      console.log('Profile updated locally:', updatedProfile);
      
      return updatedProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // Authentication methods
  const loginWithEmail = async (email, password) => {
    try {
      console.log('Attempting to log in with email:', email);
      const result = await firebaseLoginWithEmail(email, password);
      console.log('Email login successful');
      return result.user;
    } catch (error) {
      console.error('Error logging in with email:', error);
      throw error;
    }
  };

  const registerWithEmail = async (email, password) => {
    try {
      console.log('Attempting to register with email:', email);
      const result = await firebaseRegisterWithEmail(email, password);
      console.log('Email registration successful');
      return result.user;
    } catch (error) {
      console.error('Error registering with email:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Attempting Google sign-in');
      await firebaseSignInWithGoogle();
      console.log('Google sign-in initiated');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Attempting to log out');
      await firebaseLogout();
      console.log('Logout successful');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    updateUserProfile,
    loginWithEmail,
    registerWithEmail,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
