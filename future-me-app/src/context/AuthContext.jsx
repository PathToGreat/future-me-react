import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const profileDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (profileDoc.exists()) {
          setUserProfile(profileDoc.data());
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: userCredential.user.email,
      createdAt: new Date().toISOString(),
      onboardingCompleted: false,
    });
    return userCredential;
  };

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    return signOut(auth);
  };

  const updateUserProfile = async (data) => {
    console.log('🔵 AuthContext: updateUserProfile called');
    if (!user) {
      console.error('❌ No user logged in!');
      throw new Error('No user is currently logged in');
    }
    console.log('👤 User ID:', user.uid);
    console.log('📝 Data to save:', data);
    
    try {
      console.log('🔥 Writing to Firestore...');
      await setDoc(doc(db, 'users', user.uid), data, { merge: true });
      console.log('✅ Firestore write successful!');
      
      setUserProfile(prev => ({ ...prev, ...data }));
      console.log('✅ Local profile state updated');
    } catch (error) {
      console.error('❌ Firestore write failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signup,
    login,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
