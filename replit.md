# Future Me - Lifestyle Visualization Web App

## Overview

Future Me is a web application that visualizes a user's future self based on current lifestyle choices. It gathers lifestyle metrics through an interactive questionnaire and displays a dynamic avatar that adapts to health indicators. The project aims to provide an engaging and motivating experience for users to understand the impact of their daily habits on their long-term well-being.

**Key Capabilities:**
- Beta Agreement legal onboarding flow with privacy notice and terms acceptance.
- Interactive 3-step onboarding for lifestyle metric collection.
- Dynamic avatar visualization that changes based on wellness scores and trends.
- Real-time wellness score calculation and daily metric tracking.
- Future self projection based on lifestyle trends.
- User authentication with password reset functionality.
- Responsive design for various devices.

## User Preferences

Preferred communication style: Simple, everyday language.

**Branding Guidelines:**
- Language and symbolism rooted in Hebrew Scripture (Tanakh) values
- Strictly excludes mystical, new age, and occult imagery
- Uses grounded, practical symbols focused on personal development, growth, and discipline
- Acceptable emojis: ⭐📊📈✓💪❤️🎯📖🌱⚖️💤🤲➡️
- Forbidden emojis: 🔮✨🧘🌙🌟🌅🕉☯ (crystal balls, sparkles, meditation poses, moon, glowing stars, sunrises, mystical symbols)
- Faith zone represented by 📖 (open book) across all components
- Future projections use ➡️ (forward arrow) instead of mystical imagery
- All console logs and UI elements use practical, human-centered language

## System Architecture

### Frontend Architecture

The frontend is built with **React 18.3** and **Vite 7.1.9**, utilizing **TailwindCSS 3** for a utility-first styling approach with a custom design system. **Framer Motion** provides smooth animations and transitions, while **React Router v6** handles client-side routing. The application follows a component-based architecture with a `Context API` for authentication state management. Key UI/UX decisions include a custom color palette, gradient elements, and card-based layouts, all optimized for mobile-first responsiveness.

**Core Features:**
- **Onboarding Questionnaire:** A 3-step process collecting age, goals, and lifestyle ratings (activity, nutrition, sleep, stress).
- **Wellness Score Calculation:** A formula based on lifestyle inputs to generate a score from 0-100.
- **Future Me Avatar System:** An SVG-based avatar that dynamically changes color, posture, body width, and facial expression based on wellness score and lifestyle metrics.
- **Future Avatar Engine:** Projects lifestyle metrics and avatar appearance 90 days into the future based on user trends, displayed via a toggleable second avatar state.
- **Enhanced Future Path Predictions:** Calculates 30/90/180-day projections using normalized weighted factors: lifestyle trend (50%), Life Zone scores (30%), and habit consistency (20%). Displays status indicators (thriving, improving, stable, needs attention), animated progress bars, factor badges showing habit and zone contributions, and actionable insight messages. Uses confidence-adjusted deltas based on data stability.
- **Avatar Trait Map Engine:** Converts user metrics, habits, Life Zone scores, streaks, achievements, and wellness scores into 6 avatar visual traits (Posture, Body Shape, Facial Expression, Glow/Energy, Movement Level, Aura/Presence). Each trait outputs a 0-100 score with descriptive labels (e.g., "upright posture", "radiant energy") ready to feed into avatar rendering logic. Traits are calculated using weighted formulas that respond to activity levels, stress, Life Zone balance, habit streaks, and achievements. The engine is fully integrated with the FutureMeAvatar component for visible transformations including dynamic posture, facial expressions, energy particles, arm movement animations, breathing rate, and multi-ring auras.
- **Avatar Effects Engine:** A modular visual effects system (`src/components/avatar/AvatarEffectsEngine.js`) that transforms lifestyle metrics into CSS visual effects. Takes activityScore, nutritionScore, sleepScore, stressScore, and disciplineScore as inputs and outputs: brightnessLevel, contrastLevel, saturationLevel, darknessOverlay, glowIntensity, blurAmount, and postureState. Effects are applied via CSS filters and overlay layers. Key behaviors: high stress decreases saturation/brightness; low sleep adds blur; high discipline enhances contrast and glow. Designed for extensibility with constants for future effects (facial expressions, outlines, cartoonization).
- **Posture Overlay System (Phase 2):** A modular overlay component (`src/components/avatar/posture/`) that displays silhouette overlays based on postureState from the Avatar Effects Engine. Includes three SVG silhouettes (upright, neutral, slump) with Framer Motion transitions (450ms fade), scale adjustments (upright: 1.02, neutral: 1.0, slump: 0.98), and default opacity 0.3. The PostureLayer component is positioned in the avatar stack between glow effects and the main avatar, using absolute positioning and z-index separation. Designed as a reusable pattern for future overlay systems (body composition, facial expressions).
- **Facial Expression & Emotional Overlay System (Phase 3):** A modular overlay component (`src/components/avatar/FacialExpressionLayer.jsx`) that displays emotion-based facial overlays. The Avatar Effects Engine calculates emotionState (happy, content, neutral, tired, stressed) from lifestyle metrics (stress, sleep, nutrition). Each emotion state renders SVG overlays for brows, cheeks, and mouth with expression-specific presets (eyeScale, eyeY, browAngle, mouthCurve, cheekOpacity). Special indicators include eye bags for tired state, tension lines for stressed state, and sparkles for happy state. Facial overlays (energy glow, eye blur, face shadow, stress desaturation) are calculated based on metrics and applied as CSS effects. The layer only renders in avatar mode (gated on showSvgAvatar) to prevent overlays from appearing on user photos. Layer order: Aura rings -> Glow animation -> Posture overlay -> Facial Expression overlay -> Avatar image/SVG.
- **Photo/Avatar Toggle System:** A reusable toggle component (`src/components/avatar/AvatarViewToggle.jsx`) that allows users to switch between their uploaded photo and the dynamic SVG avatar in the Future Me view. Features include: VIEW_MODES constant (PHOTO, AVATAR), spring-animated slider, responsive labels (full on desktop, short on mobile), keyboard accessibility (Enter/Space support), and disabled state support. The FutureAvatar component integrates this toggle with full Avatar Effects Engine and Avatar Trait Engine integration, applying all visual effects (posture, glow, aura rings, particles, brightness, contrast) to both photo and avatar views. Uses AnimatePresence with mode="wait" for smooth 0.35s transitions between views. Default mode is Photo when images are available.
- **Daily Tracking System:** Allows users to log daily metrics (sleep, activity, nutrition, stress) with real-time dashboard updates.
- **Dashboard Visualization:** Displays the current and future avatar, metric bars, wellness score, health goals, and educational insights.
- **Life Zone System:** Tracks and displays progress across 6 life zones (Health, Social Emotional, Wealth, Faith, Family, Community) with zone-specific inputs and scoring formulas. Each zone has its own unique daily log inputs and calculates its score only from its own data. All zones initialize at 50 points for new users; onboarding saves initial Health zone data and calculates first scores. Features include interactive "View Details" modal for each zone, displaying zone-specific historical daily logs (last 10 entries), zone-specific metric input controls (sliders 1-5 for each zone's unique inputs), and immediate score recalculation upon submission. Submissions save to Firestore zoneLogs collection at `/users/{uid}/zoneLogs/{zoneId}/daily/{date}` and trigger atomic updates to user profile and all Life Zone scores.
- **Habit Builder System:** Allows users to create up to 15 custom habits with optional Life Zone linking. Each habit tracks daily completions, builds streaks, and provides bonuses to its linked zone based on streak length (1 base + 0.2 per day, capped at +5 per habit). Habits without a Life Zone link are tracked as "Personal Habits" and don't contribute to zone bonuses. Features include habit creation modal with optional zone selection, completion tracking, streak counters, delete functionality with confirmation, and integration with Future Self insights.
- **Milestone and Achievement Rewards System:** Automatically tracks user accomplishments across 14 achievements in 4 categories (habit mastery, Life Zone excellence, consistency tracking, general progress). Achievements trigger when users reach specific thresholds such as completing habit streaks (7-day, 30-day, 50-day), achieving high Life Zone scores (80+, 90+, all zones 60+), logging daily data consistently (7-day, 30-day, 100-day), and onboarding completion. Features include visual achievement badges with earned dates, category-grouped dashboard display, toast-style notifications for newly earned achievements, empty state with motivational messaging, and achievement-based insights in Future Self preview.

### Backend & Data Architecture

**Firebase Authentication v11** is used for email/password sign-up and login, ensuring secure session persistence. Features include password reset functionality via Firebase's `sendPasswordResetEmail` with user-friendly error handling. **Cloud Firestore** serves as the primary database for user data storage.

**Data Schema Highlights:**
- User profiles are stored at `/users/{userId}`, containing personal information, onboarding status, current lifestyle metrics, and Life Zone scores.
- **Zone-Specific Daily Logs:** Each Life Zone has its own daily log collection at `/users/{userId}/zoneLogs/{zoneId}/daily/{yyyy-mm-dd}`:
  - **Health:** activity (1-5), nutrition (1-5), sleep (1-5), stress (1-5)
  - **Social Emotional:** mood (1-5), stress (1-5), reflection (1-5), breathingHabit (1-5)
  - **Family:** connectionTime (1-5), communicationQuality (1-5), patience (1-5), conflictLevel (1-5)
  - **Community:** connectionsMade (1-5), conversations (1-5), supportGiven (1-5), communityEvents (1-5)
  - **Wealth:** saving (1-5), workProgress (1-5), skillsDeveloped (1-5), moneyHabits (1-5), spending (1-5)
  - **Faith:** scripturePractice (1-5), prayer (1-5), gratitude (1-5), appliedInsights (1-5)
- Legacy daily tracking data at `/users/{userId}/dailyData/{yyyy-mm-dd}` is maintained for backward compatibility (Health zone metrics only).
- **Zone-Specific Scoring Formulas:** Each zone calculates its score using only its own inputs with weighted formulas:
  - Health: Weighted average (activity 30%, nutrition 25%, sleep 25%, stress 20% inverted) + trend bonus + streak bonus
  - Social Emotional: Weighted average (mood 35%, stress 25% inverted, reflection 20%, breathing 20%) + consistency bonus + stress trend bonus
  - Family: Weighted average (connection 30%, communication 30%, patience 20%, conflict 20% inverted) + harmony bonus
  - Community: Weighted average (connections 25%, conversations 25%, support 30%, events 20%) + engagement bonus + generosity bonus
  - Wealth: Weighted average (saving 25%, work 25%, skills 20%, habits 20%, spending 10%) + streak bonus + saver bonus
  - Faith: Weighted average (scripture 30%, prayer 25%, gratitude 20%, insights 25%) + strong streak bonus (up to 40pts) + devotion bonus
- User habits are stored in a subcollection `/users/{userId}/habits/{habitId}`, containing title, zoneId (string or null for unlinked habits), streak, lastCompletedDate, completionHistory (array of dates), and createdAt timestamp. Maximum 15 habits per user.
- User achievements are stored in a subcollection `/users/{userId}/achievements/{achievementId}`, containing id, name, description, category, iconEmoji, and earnedAt timestamp. Achievements are awarded automatically when specific conditions are met and duplicate awards are prevented through idempotent Firestore writes.

### Development Environment

The project uses **Vite** for its build system and development server, **TailwindCSS** for styling, and **PostCSS** with **Autoprefixer**. Environment variables for Firebase credentials are managed through Replit secrets. The application is configured for **Vercel deployment**.

## External Dependencies

### Firebase Services
- `firebase` (11.x): Core Firebase SDK for web.
- `firebase/auth`: For user authentication (email/password).
- `firebase/firestore`: For cloud-based NoSQL database.

### UI & Styling Libraries
- `react` (18.3): Frontend UI library.
- `react-dom` (18.3): React DOM renderer.
- `react-router-dom` (7.1): For client-side routing.
- `framer-motion` (11.x): For animations and transitions.
- `tailwindcss` (3.x): Utility-first CSS framework.

### Build Tools
- `vite` (7.1.9): Next-generation frontend tooling.
- `@vitejs/plugin-react`: Provides React support for Vite.
- `postcss`: Tool for transforming CSS with JavaScript.
- `autoprefixer`: PostCSS plugin to parse CSS and add vendor prefixes.