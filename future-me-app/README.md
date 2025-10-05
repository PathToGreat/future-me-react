# Future Me - Lifestyle Visualization App

A modern web application that visualizes your future self based on current lifestyle choices. Built with React, TailwindCSS, and Firebase.

## Features

- 🔐 **Secure Authentication**: Email/password sign-up and login with Firebase
- 📝 **Lifestyle Assessment**: Interactive questionnaire collecting health metrics
- 🎨 **Dynamic Avatar**: Visual representation that changes based on your lifestyle
- 💾 **Cloud Storage**: All data securely stored in Firebase Firestore
- 📱 **Responsive Design**: Beautiful UI that works on all devices
- ✨ **Smooth Animations**: Engaging transitions powered by Framer Motion

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: TailwindCSS 3
- **Animations**: Framer Motion
- **Backend**: Firebase (Auth + Firestore)
- **Routing**: React Router v6
- **Deployment**: Vercel

## Local Development

### Prerequisites
- Node.js 18+ installed
- Firebase project created
- Firebase credentials

### Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Run the development server:
```bash
npm run dev
```

5. Open http://localhost:5000

## Project Structure

```
future-me-app/
├── src/
│   ├── components/        # React components
│   │   ├── AuthScreen.jsx
│   │   ├── Onboarding.jsx
│   │   ├── Dashboard.jsx
│   │   └── FutureMeAvatar.jsx
│   ├── context/          # React context providers
│   │   └── AuthContext.jsx
│   ├── config/           # Configuration files
│   │   └── firebase.js
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── .env                  # Environment variables
└── vite.config.js        # Vite configuration
```

## How It Works

### 1. User Journey

1. **Sign Up/Login**: Users create an account or log in with email/password
2. **Onboarding**: Complete a 3-step questionnaire about lifestyle habits
3. **Dashboard**: View personalized avatar and wellness metrics

### 2. Lifestyle Metrics

The app collects and visualizes:
- **Physical Activity Level** (1-5 scale)
- **Nutrition Quality** (1-5 scale)
- **Sleep Quality** (1-5 scale)
- **Stress Level** (1-5 scale)
- **Health Goals** (multiple choice)

### 3. Avatar Visualization

The Future Me avatar dynamically changes based on:
- **Color**: Green (thriving), Orange (improving), Red (needs attention)
- **Posture**: Upright for high activity, slouched for low activity
- **Body Shape**: Reflects nutrition and activity levels
- **Expression**: Happy/stressed based on stress levels
- **Energy Glow**: Visible particles for high overall wellness

### 4. Wellness Score

Calculated from all lifestyle metrics:
- 75-100: Thriving
- 50-74: Improving  
- 0-49: Needs Attention

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel.

## Firebase Data Structure

### Users Collection (`users`)
```javascript
{
  email: string,
  createdAt: timestamp,
  onboardingCompleted: boolean,
  activity: number (1-5),
  nutrition: number (1-5),
  sleep: number (1-5),
  stress: number (1-5),
  age: string,
  goals: array,
  lifestyleScore: number (0-100),
  completedAt: timestamp
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Future Enhancements

- AI-generated photorealistic avatars
- Wearable device integration (Apple Health, Fitbit)
- Progress tracking over time
- Social features and challenges
- Personalized health recommendations
- Advanced analytics and insights

## License

MIT
