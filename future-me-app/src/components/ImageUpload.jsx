import { useState } from 'react';
import { motion } from 'framer-motion';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function ImageUpload({ onUploadSuccess }) {
  const { user, updateUserProfile, userProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const validateImage = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      return 'Please upload only JPG or PNG images';
    }

    if (file.size > maxSize) {
      return 'Image size must be less than 10MB';
    }

    return null;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      console.error('❌ Image validation failed:', validationError);
      return;
    }

    setError(null);
    setUploading(true);
    console.log('📸 Starting image upload:', file.name, 'Size:', (file.size / 1024).toFixed(2), 'KB');
    console.log('👤 User ID:', user.uid);

    try {
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `users/${user.uid}/images/${timestamp}_${sanitizedFileName}`;
      const storageRef = ref(storage, filePath);
      
      console.log('☁️ Upload path:', filePath);
      console.log('☁️ Storage bucket:', storage.app.options.storageBucket);
      console.log('☁️ Uploading to Firebase Storage...');
      
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: user.uid,
          uploadedAt: new Date().toISOString()
        }
      };

      const snapshot = await uploadBytes(storageRef, file, metadata);
      console.log('✅ Upload successful! Snapshot:', snapshot);
      console.log('✅ Getting download URL...');
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('📸 Download URL obtained:', downloadURL);

      const currentImages = userProfile?.images || [];
      const updatedImages = [...currentImages, downloadURL];

      console.log('💾 Saving to Firestore...');
      await updateUserProfile({
        images: updatedImages,
        lastImageUploadedAt: new Date().toISOString()
      });

      console.log('🎨 Avatar updated from uploaded image');
      console.log('📊 Total images for user:', updatedImages.length);

      if (onUploadSuccess) {
        onUploadSuccess(downloadURL);
      }

      setUploading(false);
      e.target.value = '';
    } catch (err) {
      console.error('❌ Image upload failed with error:', err);
      console.error('❌ Error code:', err.code);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error details:', {
        name: err.name,
        stack: err.stack
      });
      
      let errorMessage = 'Failed to upload image. ';
      
      if (err.code === 'storage/unauthorized') {
        errorMessage += 'Permission denied. Please check Firebase Storage rules.';
      } else if (err.code === 'storage/canceled') {
        errorMessage += 'Upload was canceled.';
      } else if (err.code === 'storage/unknown') {
        errorMessage += 'Unknown error occurred. Check console for details.';
      } else if (err.code === 'storage/object-not-found') {
        errorMessage += 'Storage bucket not found.';
      } else if (err.code === 'storage/bucket-not-found') {
        errorMessage += 'Storage bucket configuration error.';
      } else if (err.code === 'storage/quota-exceeded') {
        errorMessage += 'Storage quota exceeded.';
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      setError(errorMessage);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="btn-primary cursor-pointer text-sm relative overflow-hidden">
          {uploading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Uploading...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              📸 Upload Full-Body Image
            </span>
          )}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleImageUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        <span className="text-xs text-gray-500">
          JPG or PNG, max 10MB
        </span>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm"
        >
          {error}
        </motion.div>
      )}

      {userProfile?.images && userProfile.images.length > 0 && (
        <div className="text-xs text-gray-600">
          ✅ {userProfile.images.length} image{userProfile.images.length > 1 ? 's' : ''} uploaded
        </div>
      )}
    </div>
  );
}
