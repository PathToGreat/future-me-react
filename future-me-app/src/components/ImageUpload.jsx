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

    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `users/${user.uid}/images/${timestamp}_${file.name}`);
      
      console.log('☁️ Uploading to Firebase Storage...');
      const snapshot = await uploadBytes(storageRef, file);
      console.log('✅ Upload successful! Getting download URL...');
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('📸 User uploaded image:', downloadURL);

      const currentImages = userProfile?.images || [];
      const updatedImages = [...currentImages, downloadURL];

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
      console.error('❌ Image upload failed:', err);
      setError('Failed to upload image. Please try again.');
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
