# Future Me - Lifestyle Visualization Web App

## Overview

Future Me is a web application that visualizes a user's future self based on current lifestyle choices. It gathers lifestyle metrics through an interactive questionnaire and displays a dynamic avatar that adapts to health indicators. The project aims to provide an engaging and motivating experience for users to understand the impact of their daily habits on their long-term well-being.

**Key Capabilities:**
- Interactive 3-step onboarding for lifestyle metric collection.
- Dynamic avatar visualization that changes based on wellness scores and trends.
- Real-time wellness score calculation and daily metric tracking.
- Future self projection based on lifestyle trends.
- User authentication and data persistence.
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
- **Avatar Trait Map Engine:** Converts user metrics, habits, Life Zone scores, streaks, achievements, and wellness scores into 6 avatar visual traits (Posture, Body Shape, Facial Expression, Glow/Energy, Movement Level, Aura/Presence). Each trait outputs a 0-100 score with descriptive labels (e.g., "upright posture", "radiant energy") ready to feed into avatar rendering logic. Traits are calculated using weighted formulas that respond to activity levels, stress, Life Zone balance, habit streaks, and achievements. The engine is modular and designed for future expansion without modifying avatar graphics.
- **Daily Tracking System:** Allows users to log daily metrics (sleep, activity, nutrition, stress) with real-time dashboard updates.
- **Dashboard Visualization:** Displays the current and future avatar, metric bars, wellness score, health goals, and educational insights.
- **Life Zone System:** Tracks and displays progress across 6 life zones (Health, Social Emotional, Wealth, Faith, Family, Community) with real-time scoring based on daily metrics and habit bonuses. All zones initialize at 50 points for new users; onboarding calculates first real scores.
- **Habit Builder System:** Allows users to create up to 3 custom habits linked to Life Zones. Each habit tracks daily completions, builds streaks, and provides bonuses to its linked zone based on streak length (1 base + 0.2 per day, capped at +5 per habit). Features include habit creation modal, completion tracking, streak counters, and integration with Future Self insights.
- **Milestone and Achievement Rewards System:** Automatically tracks user accomplishments across 14 achievements in 4 categories (habit mastery, Life Zone excellence, consistency tracking, general progress). Achievements trigger when users reach specific thresholds such as completing habit streaks (7-day, 30-day, 50-day), achieving high Life Zone scores (80+, 90+, all zones 60+), logging daily data consistently (7-day, 30-day, 100-day), and onboarding completion. Features include visual achievement badges with earned dates, category-grouped dashboard display, toast-style notifications for newly earned achievements, empty state with motivational messaging, and achievement-based insights in Future Self preview.

### Backend & Data Architecture

**Firebase Authentication v11** is used for email/password sign-up and login, ensuring secure session persistence. **Cloud Firestore** serves as the primary database for user data storage.

**Data Schema Highlights:**
- User profiles are stored at `/users/{userId}`, containing personal information, onboarding status, current lifestyle metrics, and Life Zone scores.
- Daily tracking data is stored in a subcollection `/users/{userId}/dailyData/{yyyy-mm-dd}`, capturing daily ratings for sleep, activity, nutrition, and stress.
- User habits are stored in a subcollection `/users/{userId}/habits/{habitId}`, containing title, zoneId, streak, lastCompletedDate, completionHistory (array of dates), and createdAt timestamp.
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