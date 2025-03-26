import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../config/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { getDoc, doc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for redirect result when component mounts
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        console.log('Checking for redirect result...');
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Redirect result found:', !!result);
          // We don't need to do anything here as onAuthStateChanged will handle the user
        }
      } catch (error) {
        console.error('Error getting redirect result:', error);
      }
    };
    
    checkRedirectResult();
  }, []);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed, user:', !!currentUser);
      setUser(currentUser);
      
      if (currentUser) {
        // Get or create user profile in Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            // Create new user profile if it doesn't exist
            const newUserProfile = {
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
            
            await setDoc(doc(db, 'users', currentUser.uid), newUserProfile);
            setUserProfile(newUserProfile);
          }
        } catch (error) {
          console.error('Error fetching or creating user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateUserProfile = async (data) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedProfile = { ...userProfile, ...data, updatedAt: new Date().toISOString() };
      
      await setDoc(userRef, updatedProfile, { merge: true });
      setUserProfile(updatedProfile);
      
      return updatedProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // Authentication methods
  const loginWithEmail = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error logging in with email:', error);
      throw error;
    }
  };

  const registerWithEmail = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error registering with email:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
      // The result will be handled by the onAuthStateChanged listener
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
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
