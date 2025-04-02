import React, { useState } from 'react';
import { View, StyleSheet, Image, Platform, Alert } from 'react-native';
import { Button, Text, Surface, useTheme } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';

/**
 * Component for uploading and managing user avatar images
 * @param {Object} props
 * @param {Function} props.onImageUploaded - Callback when image is uploaded successfully
 */
const AvatarUploader = ({ onImageUploaded }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Request permissions to access the camera/gallery
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'We need access to your photos to create your future avatar.'
        );
        return false;
      }
    }
    return true;
  };
  
  // Pick an image from the gallery
  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    
    if (!hasPermission) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        
        if (onImageUploaded) {
          await uploadImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not pick image. Please try again.');
    }
  };
  
  // Take a photo with the camera
  const takePhoto = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'We need access to your camera to create your future avatar.'
        );
        return;
      }
    }
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        
        if (onImageUploaded) {
          await uploadImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Could not take photo. Please try again.');
    }
  };
  
  // Upload the image to Firebase Storage
  const uploadImage = async (uri) => {
    if (!user || !user.uid) {
      Alert.alert('Error', 'You must be logged in to upload an image.');
      return;
    }
    
    try {
      setUploading(true);
      
      // Get file info and create a blob (for web)
      let fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
      
      // Create a storage reference
      const storage = getStorage();
      const storageRef = ref(storage, `users/${user.uid}/avatar.jpg`);
      
      // Convert image to blob for web
      let blob;
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        blob = await response.blob();
      } else {
        // For native platforms
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        blob = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = function() {
            resolve(xhr.response);
          };
          xhr.onerror = function(e) {
            reject(new TypeError('Network request failed'));
          };
          xhr.responseType = 'blob';
          xhr.open('GET', uri, true);
          xhr.send(null);
        });
      }
      
      // Upload the blob to Firebase Storage
      await uploadBytes(storageRef, blob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Call the callback with the download URL
      if (onImageUploaded) {
        onImageUploaded(downloadURL);
      }
      
      Alert.alert('Success', 'Your image has been uploaded successfully.');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Could not upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Surface style={styles.container}>
      <Text style={styles.title}>Your Avatar Photo</Text>
      <Text style={styles.subtitle}>
        Upload a full-body photo to see how your habits will transform your future self
      </Text>
      
      {image ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.previewImage} />
          <Button 
            mode="contained"
            onPress={pickImage}
            style={styles.changeButton}
            disabled={uploading}
          >
            Change Photo
          </Button>
        </View>
      ) : (
        <View style={styles.uploadContainer}>
          <View style={styles.placeholderContainer}>
            <Feather name="user" size={60} color={theme.colors.placeholder} />
            <Text style={styles.placeholderText}>No photo selected</Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={pickImage}
              style={styles.button}
              icon="image"
              disabled={uploading}
            >
              Choose from Gallery
            </Button>
            
            <Button
              mode="outlined"
              onPress={takePhoto}
              style={styles.button}
              icon="camera"
              disabled={uploading}
            >
              Take Photo
            </Button>
          </View>
        </View>
      )}
      
      {uploading && (
        <Text style={styles.uploadingText}>Uploading...</Text>
      )}
      
      <Text style={styles.privacyText}>
        Your photo is encrypted and only used to generate your future self. It's never shared.
      </Text>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 10,
    marginVertical: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  uploadContainer: {
    alignItems: 'center',
  },
  placeholderContainer: {
    width: 200,
    height: 250,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
  },
  placeholderText: {
    marginTop: 10,
    color: '#999',
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    marginVertical: 8,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 250,
    borderRadius: 10,
    marginBottom: 15,
  },
  changeButton: {
    marginVertical: 10,
  },
  uploadingText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#666',
  },
  privacyText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
});

export default AvatarUploader;