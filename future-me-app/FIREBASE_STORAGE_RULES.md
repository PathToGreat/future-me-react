# Firebase Storage Security Rules

## Current Configuration

Your Firebase Storage is properly configured in the app. To ensure only signed-in users can access their own files, apply these security rules in your Firebase Console.

## How to Apply Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Storage** → **Rules** tab
4. Copy and paste the rules below
5. Click **Publish**

## Security Rules

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow users to read/write only their own files
    match /users/{userId}/{allPaths=**} {
      // Only authenticated users can access
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
    
    // Additional rule for image uploads
    match /users/{userId}/images/{imageId} {
      // Authenticated user can only access their own images
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
      
      // Validate file type and size on write
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 10 * 1024 * 1024  // 10MB max
                   && request.resource.contentType.matches('image/.*');  // Images only
    }
  }
}
```

## Rule Explanation

### User File Access
- **Path:** `/users/{userId}/`
- **Permission:** Only the authenticated user whose UID matches `userId` can read/write
- **Security:** Prevents users from accessing other users' files

### Image Upload Validation
- **File Size:** Maximum 10MB (10,485,760 bytes)
- **File Type:** Only image files (image/jpeg, image/png, etc.)
- **Authentication:** Must be signed in
- **Authorization:** Can only upload to your own user folder

## Testing Rules

After applying these rules, test with:
1. **Signed-in user** - Should successfully upload images to `users/{their-uid}/images/`
2. **Not signed in** - Upload should fail with permission error
3. **Wrong user folder** - User A cannot upload to User B's folder

## What's Already Working in Your App

✅ Firebase Storage imported and initialized correctly
✅ Storage instance exported and accessible
✅ ImageUpload component uses proper Storage API
✅ Images saved to user-specific paths: `users/{userId}/images/{timestamp}_{filename}`
✅ Download URLs retrieved and saved to user profile
✅ Environment variables properly configured (VITE_FIREBASE_*)

## File Upload Flow

1. User selects image (JPG/PNG, max 10MB)
2. App validates file type and size
3. Creates storage reference: `users/{userId}/images/{timestamp}_{filename}`
4. Uploads file to Firebase Storage using `uploadBytes()`
5. Gets download URL using `getDownloadURL()`
6. Saves URL to Firestore user profile
7. FutureMeAvatar component displays uploaded image

## Troubleshooting

If uploads fail after applying rules:

1. **Check Firebase Console → Storage → Rules**
   - Verify rules are published
   - No syntax errors shown

2. **Check browser console for errors**
   - Look for permission denied errors
   - Verify user is authenticated

3. **Verify environment variables**
   ```bash
   # In Replit, these should be set:
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_APP_ID
   ```

4. **Restart your application**
   - Environment variable changes require app restart

## Current Implementation Files

- **Config:** `future-me-app/src/config/firebase.js` (Storage initialized)
- **Upload Component:** `future-me-app/src/components/ImageUpload.jsx`
- **Avatar Display:** `future-me-app/src/components/FutureMeAvatar.jsx`
- **Profile Update:** `future-me-app/src/context/AuthContext.jsx`
