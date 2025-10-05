# Future Me - Lifestyle Visualization Web App

## Overview

Future Me is a modern web application built with React + Vite that helps users visualize their future selves based on current lifestyle choices. The app collects lifestyle metrics through an interactive questionnaire and displays a dynamic avatar that changes based on health indicators.

**Core Features:**
- Firebase authentication (email/password sign-up and login)
- Interactive 3-step onboarding questionnaire
- Dynamic avatar visualization that responds to lifestyle inputs
- Real-time wellness score calculation
- Cloud Firestore data persistence
- Responsive design with smooth animations
- Vercel-ready deployment configuration

**Target Platform:**
- Modern web browsers (Chrome, Firefox, Safari, Edge)
- Mobile-responsive design

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18.3 with Vite 7.1.9
- TailwindCSS 3 for styling with custom design system
- Framer Motion for animations and transitions
- React Router v6 for client-side routing
- Fast HMR (Hot Module Replacement) via Vite

**UI Design System:**
- TailwindCSS utility-first styling
- Custom color palette (primary blues, accent purples)
- Gradient backgrounds and buttons
- Card-based layout components
- Custom animations (fade-in, slide-up, pulse)

**Routing & Navigation:**
- React Router with protected routes
- Four main routes:
  - `/` - Public landing page (accessible to all visitors)
  - `/auth` - Authentication screen (login/signup)
  - `/onboarding` - 3-step lifestyle questionnaire (private)
  - `/dashboard` - Future Me visualization and metrics (private)

**State Management:**
- React Context API for authentication (`AuthContext`)
- Local component state with hooks
- No external state management library (intentionally minimal)

**Key Architectural Patterns:**
- Component-based architecture
- Context provider pattern for auth state
- Protected route wrapper components
- Separation of concerns (config, context, components)

### Backend & Data Architecture

**Authentication:**
- Firebase Authentication v11
- Email/Password authentication
- Session persistence
- Auth state synchronized with Firestore

**Database:**
- Cloud Firestore for user data
- Simple flat structure at `/users/{userId}`
- All user data in single document (no subcollections)

**Data Schema:**
```javascript
users/{userId}
  - email: string
  - createdAt: timestamp (ISO string)
  - onboardingCompleted: boolean
  - age: string
  - goals: array of strings
  - activity: number (1-5)
  - nutrition: number (1-5)
  - sleep: number (1-5)
  - stress: number (1-5)
  - lifestyleScore: number (0-100)
  - completedAt: timestamp (ISO string)
```

### Core Feature Implementations

**Onboarding Questionnaire:**
- Step 1: Age and health goals selection
- Step 2: Activity and nutrition quality ratings (1-5 sliders)
- Step 3: Sleep quality and stress level ratings (1-5 sliders)
- Progress bar visualization
- Data saved to Firestore upon completion

**Wellness Score Calculation:**
```javascript
lifestyleScore = (activity + nutrition + sleep + (5 - stress)) / 16 * 100
```

**Future Me Avatar System:**
- SVG-based human-like avatar
- Color changes based on wellness score:
  - Green (75-100): Thriving
  - Orange (50-74): Improving
  - Red (0-49): Needs Attention
- Dynamic features:
  - Posture reflects activity level
  - Body width reflects nutrition
  - Facial expression reflects stress
  - Glow and particles for high energy
  - Arm movement animation for active users

**Dashboard Visualization:**
- Animated avatar display
- Metric bars showing lifestyle inputs
- Wellness score card with gradient
- Health goals display
- Educational information cards
- Retake assessment functionality

### Animation & User Experience

**Framer Motion Animations:**
- Page transitions (fade-in, slide-up)
- Avatar scale-in with spring animation
- Pulsing glow effects
- Metric bar fill animations
- Energy particle effects

**Responsive Design:**
- Mobile-first approach with TailwindCSS
- Breakpoint at 768px for tablet/desktop
- Touch-friendly UI elements
- Flexible grid layouts

### Development Environment

**Configuration Files:**
- `vite.config.js` - Vite configuration with dev server on port 5000
- `tailwind.config.js` - TailwindCSS theme and plugin configuration
- `postcss.config.js` - PostCSS with TailwindCSS and Autoprefixer
- `.env` - Firebase credentials (not committed, uses Replit secrets)
- `.env.example` - Template for environment variables
- `vercel.json` - Vercel deployment configuration

**Project Structure:**
```
future-me-app/
├── src/
│   ├── components/
│   │   ├── AuthScreen.jsx
│   │   ├── Onboarding.jsx
│   │   ├── Dashboard.jsx
│   │   └── FutureMeAvatar.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── config/
│   │   └── firebase.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── .env
├── .gitignore
├── vite.config.js
├── tailwind.config.js
├── package.json
├── vercel.json
├── README.md
├── DEPLOYMENT.md
└── FIREBASE-DATA-GUIDE.md
```

**Build & Deployment:**
- Development: `npm run dev` (Vite dev server on port 5000)
- Production: `npm run build` (outputs to `dist/` directory)
- Preview: `npm run preview` (preview production build)
- Deployment target: Vercel (configured via vercel.json)

## External Dependencies

### Firebase Services (v11)
- **firebase** (11.x) - Core Firebase SDK
- **firebase/auth** - User authentication
- **firebase/firestore** - Cloud database
- Configuration via environment variables

### UI & Styling Libraries
- **react** (18.3) - UI library
- **react-dom** (18.3) - React DOM renderer
- **react-router-dom** (7.1) - Client-side routing
- **framer-motion** (11.x) - Animation library
- **tailwindcss** (3.x) - Utility-first CSS framework

### Build Tools
- **vite** (7.1.9) - Build tool and dev server
- **@vitejs/plugin-react** - React support for Vite
- **postcss** - CSS processing
- **autoprefixer** - CSS vendor prefixing

## Environment Variables

Required secrets (stored in Replit Secrets):
- `FIREBASE_API_KEY` - Firebase Web API Key
- `FIREBASE_PROJECT_ID` - Firebase Project ID
- `FIREBASE_APP_ID` - Firebase Application ID

Used in app as:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

## Deployment

### Vercel Deployment
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: Set VITE_* variables in Vercel dashboard
- SPA Routing: Configured via vercel.json rewrites

### Firebase Setup Required
1. Enable Email/Password authentication in Firebase Console
2. Create Firestore database (start in production mode or test mode)
3. Add Vercel domain to Firebase authorized domains
4. Ensure Firebase security rules allow authenticated user data access

## Recent Changes (October 2025)

- **Upgraded from static HTML to React + Vite SPA**
- **Replaced blob avatars with SVG-based human-like avatars**
- **Implemented 3-step onboarding questionnaire**
- **Added Framer Motion animations throughout**
- **Created responsive mobile-first design with TailwindCSS**
- **Configured for Vercel deployment**
- **Simplified data structure (single user document instead of subcollections)**
- **Created comprehensive deployment and Firebase data viewing guides**
- **Added public landing page at root route (`/`)** (Oct 5, 2025)
- **Moved authentication to `/auth` with "Back to Home" navigation** (Oct 5, 2025)
- **Removed all legacy HTML files from root directory** (Oct 5, 2025)
- **App now defaults to landing page at `/` instead of old navigation.html** (Oct 5, 2025)

## Legacy Components

The following older components are kept for reference but not actively used:
- React Native Expo app (multiple directories)
- Old test directories (simple-test, react-test, basic-html-app, etc.)
- Webpack configurations for React Native Web

**Note:** Legacy HTML files (navigation.html, full-app.html, etc.) have been removed from root directory as of Oct 5, 2025.

Current active app: `future-me-app/` (React + Vite SPA)
