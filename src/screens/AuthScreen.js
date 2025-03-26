import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions,
  Animated
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Headline, 
  Subheading, 
  Surface, 
  useTheme,
  ActivityIndicator,
  Snackbar
} from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { 
  registerWithEmail, 
  loginWithEmail, 
  signInWithGoogle 
} from '../config/firebase';

const { width } = Dimensions.get('window');

const AuthScreen = () => {
  const theme = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Animation values
  const [slideAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(1));

  const toggleAuthMode = () => {
    // Animate transition
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: isLogin ? width : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsLogin(!isLogin);
      // Reset animation values
      slideAnim.setValue(isLogin ? width : 0);
      
      // Animate back in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
    
    // Clear any previous errors
    setError('');
  };

  const handleAuthAction = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (isLogin) {
        // Login
        await loginWithEmail(email, password);
      } else {
        // Register
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        
        await registerWithEmail(email, password);
      }
    } catch (err) {
      let errorMessage = err.message;
      
      // Provide more user-friendly error messages
      if (errorMessage.includes('auth/user-not-found') || errorMessage.includes('auth/wrong-password')) {
        errorMessage = 'Invalid email or password';
      } else if (errorMessage.includes('auth/email-already-in-use')) {
        errorMessage = 'Email is already in use';
      } else if (errorMessage.includes('auth/invalid-email')) {
        errorMessage = 'Please enter a valid email address';
      } else if (errorMessage.includes('auth/weak-password')) {
        errorMessage = 'Password is too weak';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
    } catch (err) {
      setError('Google sign in failed. Please try again.');
      console.error('Google sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: theme.colors.primary }]}>Future Me</Text>
          <Text style={styles.tagline}>Build better habits, shape your future</Text>
        </View>

        <Animated.View 
          style={[
            styles.formContainer,
            { 
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <Surface style={styles.surface}>
            <Headline style={styles.authTitle}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Headline>
            
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              left={<TextInput.Icon name={() => <Feather name="mail" size={20} color={theme.colors.primary} />} />}
            />
            
            <View style={styles.passwordContainer}>
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                style={styles.input}
                left={<TextInput.Icon name={() => <Feather name="lock" size={20} color={theme.colors.primary} />} />}
                right={
                  <TextInput.Icon 
                    name={() => (
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Feather 
                          name={showPassword ? "eye-off" : "eye"} 
                          size={20} 
                          color={theme.colors.primary} 
                        />
                      </TouchableOpacity>
                    )} 
                  />
                }
              />
            </View>
            
            {!isLogin && (
              <View style={styles.passwordContainer}>
                <TextInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  mode="outlined"
                  secureTextEntry={!showConfirmPassword}
                  style={styles.input}
                  left={<TextInput.Icon name={() => <Feather name="lock" size={20} color={theme.colors.primary} />} />}
                  right={
                    <TextInput.Icon 
                      name={() => (
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                          <Feather 
                            name={showConfirmPassword ? "eye-off" : "eye"} 
                            size={20} 
                            color={theme.colors.primary} 
                          />
                        </TouchableOpacity>
                      )} 
                    />
                  }
                />
              </View>
            )}
            
            {isLogin && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}
            
            <Button 
              mode="contained" 
              onPress={handleAuthAction}
              style={styles.button}
              loading={loading}
              disabled={loading}
            >
              {isLogin ? 'Login' : 'Register'}
            </Button>
            
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>
            
            <Button 
              mode="outlined" 
              onPress={handleGoogleSignIn}
              style={styles.googleButton}
              icon={() => <Feather name="google" size={18} color={theme.colors.primary} />}
              disabled={loading}
            >
              Continue with Google
            </Button>
          </Surface>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {isLogin ? 'Don\'t have an account?' : 'Already have an account?'}
            </Text>
            <TouchableOpacity onPress={toggleAuthMode}>
              <Text style={[styles.switchAction, { color: theme.colors.primary }]}>
                {isLogin ? 'Register' : 'Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
      
      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setError(''),
        }}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: 16,
    marginTop: 8,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  surface: {
    padding: 20,
    borderRadius: 10,
    elevation: 4,
  },
  authTitle: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 15,
  },
  passwordContainer: {
    marginBottom: 15,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  button: {
    marginTop: 10,
    paddingVertical: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#888',
  },
  googleButton: {
    marginBottom: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  switchText: {
    marginRight: 5,
    color: '#666',
  },
  switchAction: {
    fontWeight: 'bold',
  },
});

export default AuthScreen;
