# Viewing User Data in Firebase

## Accessing Firebase Console

1. Go to https://console.firebase.google.com
2. Sign in with your Google account
3. Select your "Future Me" project from the project list

## Viewing Authentication Data

### Step 1: Navigate to Authentication
1. In the Firebase Console left sidebar, click **Authentication**
2. Click on the **Users** tab at the top

### What You'll See
- **User UID**: Unique identifier for each user
- **Identifier**: User's email address
- **Providers**: Authentication method (Email/Password)
- **Created**: Date and time when the user signed up
- **Signed In**: Last sign-in timestamp
- **User UID**: Can be copied for Firestore queries

## Viewing User Profile Data (Firestore)

### Step 1: Navigate to Firestore Database
1. In the Firebase Console left sidebar, click **Firestore Database**
2. You'll see the database collections listed

### Step 2: Browse the Users Collection
1. Click on the **users** collection
2. You'll see a list of user documents (one per user)
3. Each document ID matches the User UID from Authentication

### Step 3: View Individual User Data
Click on any user document to see their complete profile:

```
users/{userId}/
├── email: "user@example.com"
├── createdAt: "2025-10-05T11:30:00.000Z"
├── onboardingCompleted: true
├── age: "28"
├── goals: ["Fitness", "Better Sleep", "Longevity"]
├── activity: 4
├── nutrition: 3
├── sleep: 4
├── stress: 2
├── lifestyleScore: 75
└── completedAt: "2025-10-05T11:35:00.000Z"
```

## Understanding the Data

### User Profile Fields

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | User's email address |
| `createdAt` | timestamp | Account creation date/time |
| `onboardingCompleted` | boolean | Whether user finished the questionnaire |
| `age` | string | User's age |
| `goals` | array | Selected health goals |
| `activity` | number | Physical activity level (1-5) |
| `nutrition` | number | Nutrition quality (1-5) |
| `sleep` | number | Sleep quality (1-5) |
| `stress` | number | Stress level (1-5) |
| `lifestyleScore` | number | Overall wellness score (0-100) |
| `completedAt` | timestamp | When they completed the assessment |

## Exporting User Data

### Export All Users
1. In Firestore Database, click the **three dots** menu
2. Select **Export collection**
3. Choose your export format (JSON recommended)
4. Download the file

### Export Authentication Users
1. In Authentication > Users tab
2. Click **Export users** at the top
3. Select format and download

## Querying Specific Data

### Find Users by Wellness Score
1. In Firestore, go to **users** collection
2. Click **Add filter**
3. Set: `lifestyleScore` `>=` `75` (for thriving users)
4. Click **Apply**

### Find Users by Goal
1. In Firestore, go to **users** collection  
2. Click **Add filter**
3. Set: `goals` `array-contains` `Fitness`
4. Click **Apply**

## Real-Time Monitoring

### Set Up Cloud Firestore Rules (Security)
1. Go to **Firestore Database** > **Rules** tab
2. Replace the existing rules with the complete rules below that cover all data paths:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // User profile document
    match /users/{userId} {
      // Allow users to read and write their own profile
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Zone-specific daily logs: /users/{uid}/zoneLogs/{zoneId}/daily/{date}
      match /zoneLogs/{zoneId}/daily/{date} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Legacy daily tracking data: /users/{uid}/dailyData/{date}
      match /dailyData/{date} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // User habits: /users/{uid}/habits/{habitId}
      match /habits/{habitId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // User achievements: /users/{uid}/achievements/{achievementId}
      match /achievements/{achievementId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### Quick Deploy via Firebase CLI
If you have the Firebase CLI installed, you can deploy these rules from the terminal:
```bash
cd future-me-app
firebase login
firebase deploy --only firestore:rules
```

### Monitor Database Activity
1. Go to **Firestore Database** > **Usage** tab
2. View:
   - Read/Write operations over time
   - Storage usage
   - Active connections

## Analytics Integration (Optional)

### Enable Google Analytics
1. In Firebase Console, click **Analytics** in the sidebar
2. Click **Enable Google Analytics**
3. Follow the setup wizard
4. Once enabled, you can track:
   - User engagement
   - User retention
   - Custom events (sign-ups, assessments completed)

## Troubleshooting

### No Users Showing in Authentication
- Check that email/password authentication is enabled
- Verify users are successfully signing up in the app
- Check browser console for Firebase errors

### No Data in Firestore
- Verify Firestore database is created (not in Datastore mode)
- Check Firestore rules allow writes
- Look for JavaScript errors in browser console
- Verify Firebase configuration in the app

### Missing Fields in User Documents
- User may not have completed onboarding
- Check `onboardingCompleted` field value
- Review app code to ensure all fields are being saved

## Data Privacy & Security

### Best Practices
1. **Access Control**: Limit who can access Firebase Console
2. **Security Rules**: Keep Firestore rules restrictive
3. **Data Retention**: Set up automatic data deletion policies if needed
4. **GDPR Compliance**: Implement data export/deletion for user requests
5. **Audit Logs**: Review access logs regularly in IAM & Admin

### Deleting User Data
To delete a user and their data:
1. **Authentication**: Go to Users tab > click user > Delete account
2. **Firestore**: Go to users collection > find document > Delete
3. **Note**: Consider implementing automatic cleanup when users delete accounts

## Support Resources

- [Firebase Console](https://console.firebase.google.com)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
