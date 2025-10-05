# Future Me App - Vercel Deployment Guide

## Prerequisites
- A Vercel account (sign up at https://vercel.com)
- Firebase project credentials

## Step-by-Step Deployment Instructions

### 1. Prepare Your Firebase Environment Variables

You'll need these three values from your Firebase project:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

### 2. Build the Project Locally (Optional Test)

```bash
cd future-me-app
npm run build
```

This creates a `dist` folder with the production build.

### 3. Deploy to Vercel

#### Option A: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
cd future-me-app
vercel
```

3. Follow the prompts and add environment variables when asked.

#### Option B: Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new

2. Import your Git repository (or drag and drop the `future-me-app` folder)

3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `future-me-app` (if deploying from a monorepo, otherwise leave as `.`)
   - **Build Command**: `npm run build` (should be auto-detected)
   - **Output Directory**: `dist` (should be auto-detected)

4. Add Environment Variables:
   Click "Environment Variables" and add:
   ```
   VITE_FIREBASE_API_KEY = your_firebase_api_key
   VITE_FIREBASE_PROJECT_ID = your_firebase_project_id
   VITE_FIREBASE_APP_ID = your_firebase_app_id
   ```

5. Click "Deploy"

### 4. Post-Deployment Configuration

#### Update Firebase Authorized Domains

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add your Vercel deployment domain (e.g., `your-app.vercel.app`)

### 5. Verify Deployment

1. Visit your deployed URL
2. Test the sign-up flow
3. Complete the onboarding questionnaire
4. View your Future Me avatar on the dashboard

## Viewing User Data in Firebase

### Authentication Data
1. Go to Firebase Console
2. Click **Authentication** in the left sidebar
3. You'll see a list of all signed-up users with:
   - Email addresses
   - Sign-up dates
   - Last sign-in times

### User Profile Data (Firestore)
1. Go to Firebase Console
2. Click **Firestore Database** in the left sidebar
3. Navigate to the `users` collection
4. Each user document contains:
   - Email
   - Created timestamp
   - Onboarding status
   - Lifestyle metrics (activity, nutrition, sleep, stress)
   - Wellness score
   - Health goals
   - Assessment completion date

## Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check that environment variables are properly set
- Verify Firebase configuration is correct

### Runtime Errors
- Check browser console for Firebase errors
- Verify authorized domains in Firebase
- Ensure environment variables are available in Vercel

### Authentication Issues
- Confirm email/password authentication is enabled in Firebase Console
- Check that Firebase API key has proper permissions
- Verify the correct Firebase project ID is being used

## Environment Variables Reference

Required environment variables for Vercel deployment:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | `AIza...` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `future-me-app` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123...` |

## Production Checklist

- [ ] Environment variables added to Vercel
- [ ] Firebase authorized domains updated
- [ ] Email/Password authentication enabled in Firebase
- [ ] Firestore database created and configured
- [ ] Test complete user flow (sign-up → onboarding → dashboard)
- [ ] Verify data is being saved to Firestore

## Support

For issues with:
- **Vercel**: https://vercel.com/docs
- **Firebase**: https://firebase.google.com/docs
- **Vite**: https://vitejs.dev/guide
