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

## Recent Changes

### November 17, 2025 - Dashboard Expansion & Body Composition Model

- **Intelligent Body Composition Model** (NEW)
  - Created `bodyCompositionModel.js` utility with weighted scoring algorithm
  - Composite score from activity (35%), nutrition (30%), sleep (20%), stress (15%)
  - Fixed nutrition mapping: poor nutrition now increases avatar width, good nutrition normalizes it
  - Avatar body shape now reflects combined lifestyle inputs, not just nutrition
  
- **Expanded Dashboard Components** (NEW)
  - `FutureSelfPreview.jsx`: Top banner showing Future Self Score with reactive messaging and subtitle
  - `ZoneCard.jsx`: Life zone cards for Health, Wealth, Faith, Family, Community, Social Emotional
  - `DailyInsight.jsx`: Enhanced with 9 prioritized insight variations based on metric combinations
  - `JourneyMeter.jsx`: Progress bar showing assessment completion and profile status
  
- **Zone System** (NEW)
  - Health zone: Calculated from existing lifestyle metrics
  - Social Emotional zone: Calculated from stress inverse
  - Placeholder zones (Wealth, Faith, Family, Community): Set to 48-55 with "Full tracking coming soon"
  - Trend arrows and color-coded scoring for all zones
  
- **Enhanced Daily Insights**
  - 9 different insight variations prioritized by metric severity
  - Combinations: high stress, poor sleep + stress, low stress, good sleep + activity, high activity, good nutrition, low activity, poor nutrition
  - No contradictory messaging, emotionally motivating language
  
- **FutureSelfPreview Enhancements**
  - Added reactive subtitle based on lifestyle score ranges
  - 80+: "Your direction is strong and consistent"
  - 60-79: "You're improving and building momentum"
  - <60: "Your current patterns may be limiting your future potential"
  
- **Updated Dashboard Text**
  - Body Composition description now reads: "Your avatar's body shape reflects your combined lifestyle inputs"
  - Removed misleading "nutrition = body width" language

### November 18, 2025 - Future Avatar Engine

- **Future Avatar Model** (NEW)
  - Created `futureAvatarModel.js` utility to project lifestyle metrics based on trends
  - Uses existing trend data to calculate 90-day projections for activity, nutrition, sleep, stress
  - Projects future body composition score and avatar properties (width, glow, posture, expression)
  - Dynamic description generation based on trajectory (improving, declining, stable)
  
- **FutureAvatar Component** (NEW)
  - `FutureAvatar.jsx`: Second avatar state showing projected appearance
  - Same visual style as current avatar but uses projected metrics
  - Displays "🔮 90-Day Projection" badge to distinguish from current state
  - Energy particles and glow effects respond to projected lifestyle score
  
- **Avatar Toggle System** (NEW)
  - Toggle UI switch: "Current You" ↔ "Future You"
  - Gradient buttons (blue for current, purple/pink for future)
  - Disabled state when insufficient history data (shows "Coming Soon")
  - Smooth transitions between avatar states
  
- **Dashboard Integration**
  - Toggle placed between ImageUpload and avatar display
  - Metrics panel updates dynamically: "Your Lifestyle Metrics" → "Projected Metrics (90 Days)"
  - Dynamic descriptions below avatar:
    - Current: "This is your current self based on today's lifestyle habits"
    - Future (positive): "You are on track for a stronger, healthier future self"
    - Future (warning): "Your current patterns may reduce your future potential"
    - Future (neutral): "Your future self will reflect your consistency"
  
- **Future Metrics Projection Logic**
  - Requires 2+ days of history data to unlock
  - Uses `getMetricTrend()` from analyzeTrends.js for individual metric slopes
  - Projects each metric forward while clamping values to 1-5 range
  - Recalculates body composition score using projected values
  - Displays as 90-day outlook (configurable timeframe)
  
- **Preserved Functionality**
  - All existing features remain intact
  - Current avatar rendering unchanged
  - Firebase listeners, trends, predictions continue working
  - Daily Insight, Journey Meter, Zones all functional

### October 2025

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
- **Fixed "See My Future" button freeze by removing problematic subcollection writes** (Oct 5, 2025)
- **All user data now saves correctly to single document at users/{uid}** (Oct 5, 2025)
- **Implemented intelligent avatar trend analysis system (Phase 1)** (Oct 6, 2025)
  - Daily snapshot storage to users/{uid}/history/{date}
  - 7-day trend detection with improving/declining/stable states
  - Avatar visual adaptations: brightness filters, glow pulse animations
  - Trend indicator card on Dashboard
- **Implemented predictive visualization system (Phase 2)** (Oct 6, 2025)
  - 30/90/180-day future projections based on trend trajectory
  - Future Path card with horizontal progress bars
  - Motivational messages based on projected outcomes
  - Avatar animations respond to predictions: upward motion for positive trajectory, green glow for improving trends
  - Console logging for testing prediction accuracy

## Legacy Components

The following older components are kept for reference but not actively used:
- React Native Expo app (multiple directories)
- Old test directories (simple-test, react-test, basic-html-app, etc.)
- Webpack configurations for React Native Web

**Note:** Legacy HTML files (navigation.html, full-app.html, etc.) have been removed from root directory as of Oct 5, 2025.

Current active app: `future-me-app/` (React + Vite SPA)
