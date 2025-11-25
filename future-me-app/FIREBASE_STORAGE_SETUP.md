# Firebase Storage Setup Guide

## ⚠️ CRITICAL: Apply These Rules in Firebase Console

Your Firebase Storage upload functionality requires these **exact security rules** to be configured in your Firebase Console. Without these rules, uploads will fail with permission errors.

## 🔒 Firebase Storage Security Rules

### How to Apply

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Storage** → **Rules** tab
4. **Replace all existing rules** with the rules below
5. Click **Publish**

### Rules to Copy

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Allow each user to access only their own profilePictures folder
    match /profilePictures/{fileName} {
      allow read, write: if request.auth != null
                         && fileName.matches('^' + request.auth.uid + '_.*');
    }

    // Allow each user to upload images inside users/{uid}/images/*
    match /users/{userId}/images/{fileName} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }

    // Allow each user to upload their avatar at users/{uid}/avatar.jpg
    match /users/{userId}/avatar.jpg {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }

    // Block everything else
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## 📂 File Path Requirements

Your app uses the following upload paths that **must match** the rules above:

### Current Implementation

| Feature | Upload Path | Rule Match |
|---------|-------------|------------|
| User Images | `users/{uid}/images/{timestamp}_{filename}` | ✅ Matches `users/{userId}/images/{fileName}` |

### Supported Paths (from rules)

| Path Pattern | Example | Access |
|--------------|---------|--------|
| `profilePictures/{uid}_{timestamp}.jpg` | `profilePictures/abc123_1234567890.jpg` | User can only upload files starting with their UID |
| `users/{uid}/images/{filename}` | `users/abc123/images/1234567890_photo.jpg` | User can only upload to their own folder |
| `users/{uid}/avatar.jpg` | `users/abc123/avatar.jpg` | User can only upload their own avatar |

## ✅ Code Implementation Details

### Firebase Configuration (`future-me-app/src/config/firebase.js`)

```javascript
// ✅ Storage uses the same Firebase app instance as Auth and Firestore
export const storage = getStorage(app);
```

**What this ensures:**
- Single Firebase app instance shared across Auth, Firestore, and Storage
- No duplicate initializations
- Proper authentication context for Storage requests

### Image Upload Component (`future-me-app/src/components/ImageUpload.jsx`)

**Upload Path:**
```javascript
const filePath = `users/${user.uid}/images/${timestamp}_${sanitizedFileName}`;
```

**File Validation:**
- ✅ File type: JPG/PNG only
- ✅ File size: Maximum 10MB
- ✅ Filename sanitization: Removes special characters

**Upload Metadata:**
```javascript
{
  contentType: file.type,
  customMetadata: {
    uploadedBy: user.uid,
    uploadedAt: timestamp
  }
}
```

**Error Handling:**
- ✅ Comprehensive error codes and messages
- ✅ Spinner stops on both success and error
- ✅ Detailed console logging for debugging
- ✅ User-friendly error messages

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Infinite Loading Spinner

**Symptom:** Upload button shows spinner forever

**Causes:**
- ❌ Firebase Storage rules not applied in Console
- ❌ Storage bucket not configured in Firebase project
- ❌ User not authenticated

**Solutions:**
1. Apply the rules above in Firebase Console → Storage → Rules
2. Verify Storage is enabled: Firebase Console → Storage (should not show "Get Started")
3. Ensure user is logged in before uploading

#### 2. Permission Denied (403 Error)

**Symptom:** Console shows `storage/unauthorized` error

**Cause:**
- ❌ Firebase Storage rules don't allow the upload path

**Solutions:**
1. Verify rules exactly match the template above
2. Check that user is authenticated (has valid `request.auth.uid`)
3. Ensure upload path matches: `users/{userId}/images/{fileName}`

#### 3. 404 Errors / Preflight Failures

**Symptom:** Network tab shows 404 or CORS preflight errors

**Causes:**
- ❌ Storage bucket doesn't exist
- ❌ Storage bucket name is incorrect
- ❌ Storage is not enabled in Firebase project

**Solutions:**
1. Go to Firebase Console → Storage
2. If you see "Get Started" button, click it to enable Storage
3. Verify storage bucket exists: `{project-id}.appspot.com`
4. Check browser console for exact bucket URL being used

#### 4. Storage Bucket Not Found

**Symptom:** Console shows `storage/bucket-not-found` error

**Cause:**
- ❌ Storage not enabled in Firebase project
- ❌ Incorrect project ID in environment variables

**Solutions:**
1. Enable Storage in Firebase Console
2. Verify environment variables:
   ```bash
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_APP_ID=your-app-id
   ```

## 🔍 Debugging Checklist

When uploads fail, check in order:

### 1. Console Logs
Look for these messages in browser console:
- ✅ `🔥 Initializing Firebase with config:` - Shows Storage bucket URL
- ✅ `📸 Starting image upload:` - Upload initiated
- ✅ `☁️ Upload path:` - Exact path being used
- ✅ `☁️ Storage bucket:` - Bucket URL
- ❌ `❌ Image upload failed with error:` - Error details

### 2. Firebase Console
- [ ] Storage is enabled (not showing "Get Started")
- [ ] Rules are published (check Rules tab)
- [ ] Storage bucket exists
- [ ] Files are visible in Files tab after successful upload

### 3. Network Tab
- [ ] Request to `firebasestorage.googleapis.com` exists
- [ ] No CORS errors (look for red text)
- [ ] Response is 200 OK (not 403, 404, or 500)

### 4. Authentication
- [ ] User is logged in (check `user.uid` in console)
- [ ] Auth token is valid (try logging out and back in)

## 📊 Expected Console Output

### Successful Upload
```
🔥 Initializing Firebase with config: { projectId: "...", storageBucket: "...appspot.com" }
✅ Firebase initialized successfully
📸 Starting image upload: photo.jpg Size: 523.45 KB
👤 User ID: abc123def456
☁️ Upload path: users/abc123def456/images/1234567890_photo.jpg
☁️ Storage bucket: your-project.appspot.com
☁️ Uploading to Firebase Storage...
✅ Upload successful! Snapshot: { ... }
✅ Getting download URL...
📸 Download URL obtained: https://firebasestorage.googleapis.com/...
💾 Saving to Firestore...
🎨 Avatar updated from uploaded image
📊 Total images for user: 1
```

### Failed Upload (Permission Denied)
```
❌ Image upload failed with error: FirebaseError: Firebase Storage: ...
❌ Error code: storage/unauthorized
❌ Error message: Permission denied. Please check Firebase Storage rules.
```

## 🚀 Deployment Notes

### Local Development (Replit)
- ✅ Uses VITE_* environment variables from Replit Secrets
- ✅ Storage bucket auto-configured from project ID
- ✅ Works with Replit's dev server at port 5000

### Production Deployment (Vercel/Other)
- ⚠️ Ensure environment variables are set in deployment platform
- ⚠️ Same Firebase Storage rules apply to production
- ⚠️ No code changes needed - same implementation works everywhere

## 📝 Summary of Changes Made

### Files Modified

1. **`future-me-app/src/config/firebase.js`**
   - Added initialization logging to debug Storage bucket configuration
   - Confirms Storage is using the same app instance as Auth/Firestore
   - No functional changes - just added debugging logs

2. **`future-me-app/src/components/ImageUpload.jsx`**
   - Added filename sanitization (removes special characters)
   - Added upload metadata (contentType, uploadedBy, uploadedAt)
   - Enhanced error handling with specific Firebase Storage error codes
   - Improved console logging at each step
   - **Ensured spinner stops on both success AND error** (fixes infinite spinner)
   - More user-friendly error messages

### What Was NOT Changed

- ✅ Firebase Auth configuration (unchanged)
- ✅ Firestore configuration (unchanged)
- ✅ Upload file path (still uses `users/{uid}/images/...`)
- ✅ File validation (still JPG/PNG, max 10MB)
- ✅ Environment variables (no new variables added)
- ✅ Firebase app initialization (still uses single app instance)

## 🎯 Next Steps

1. **Apply Firebase Storage Rules** (see top of this document)
2. **Restart your app** to see the new debug logs
3. **Try uploading an image** and check console for detailed output
4. **If it fails**, follow the troubleshooting checklist above
5. **Copy the console error output** and we can diagnose the exact issue

The most common issue is simply that Storage rules haven't been applied in the Firebase Console yet!
