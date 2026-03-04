import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getDefaultLifeZones } from '../utils/lifeZoneEngine';
import { setStorageUserId } from '../components/SkinToneSelector';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile = null;
    let initialProfileLoaded = false;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setStorageUserId(currentUser?.uid || null);
      
      if (currentUser) {
        console.log('🔄 Setting up real-time listener for user:', currentUser.uid);
        setProfileLoading(true);
        
        // Set up real-time listener for user profile
        unsubscribeProfile = onSnapshot(
          doc(db, 'users', currentUser.uid),
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              console.log('💡 Metrics Updated - LifestyleScore:', data.lifestyleScore, 
                         'Activity:', data.activity, 
                         'Nutrition:', data.nutrition, 
                         'Sleep:', data.sleep, 
                         'Stress:', data.stress);
              setUserProfile(data);
            }
            if (!initialProfileLoaded) {
              initialProfileLoaded = true;
              setProfileLoading(false);
              setLoading(false);
            }
          },
          (error) => {
            console.error('❌ Firebase listener error:', error);
            setProfileLoading(false);
            setLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        setProfileLoading(false);
        setLoading(false);
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const signup = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const defaultZones = getDefaultLifeZones();
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: userCredential.user.email,
      createdAt: new Date().toISOString(),
      onboardingCompleted: false,
      lifeZones: defaultZones,
    });
    console.log('✅ User created with default Life Zones');
    return userCredential;
  };

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    return signOut(auth);
  };

  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email);
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
    resetPassword,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
