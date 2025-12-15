# Future Me - Lifestyle Visualization Web App

## Overview

Future Me is a web application designed to visualize a user's future self based on their current lifestyle choices. It collects lifestyle metrics through an interactive questionnaire and dynamically adapts an avatar to reflect health indicators. The core purpose is to engage and motivate users to understand the long-term impact of their daily habits on their well-being. Key capabilities include legal onboarding, 6-step metric collection, dynamic avatar visualization, real-time wellness score calculation, future self projection, user authentication, and a responsive design. The project aims to provide a tool for personal development, growth, and discipline, emphasizing practical guidance over mystical or new-age concepts.

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

The frontend uses React 18.3, Vite 7.1.9, TailwindCSS 3 for styling, Framer Motion for animations, and React Router v6 for routing. It employs a component-based architecture with the Context API for authentication and shared state. UI/UX emphasizes a custom color palette, gradients, card-based layouts, and mobile-first responsiveness. The application features a multi-screen mobile architecture with persistent bottom navigation.

**Key Features and Design Patterns:**

-   **Multi-Screen Architecture:** Five main screens (Home, Avatar, Habits, Metrics, Menu) with `BottomNavigation.jsx` and `MainLayout.jsx` for consistent navigation and smooth transitions.
-   **Onboarding & Metric Collection:** A 6-step questionnaire for initial data input, covering various lifestyle aspects. A `OnboardingWalkthrough.jsx` guides new users.
-   **Dynamic Avatar System:** An SVG-based avatar dynamically adjusts visual traits based on wellness scores and metrics. This includes:
    -   **Current Me vs. Future Me:** "Current Me" is a locked baseline, while "Future Me" is a 90-day projection based on daily trends.
    -   **Avatar Engines:** Projects future appearance, converts data to visual traits, and applies CSS effects.
    -   **Visual Overlays:** Posture, facial expressions, gender-specific body morphing, energy glow, and photo effects.
    -   **Avatar Input Routing Gateway:** Controls which inputs affect "Current Me" versus "Future Me" avatars, ensuring baseline integrity.
-   **Wellness Score Calculation:** A formula computes a 0-100 score from user inputs.
-   **Daily Tracking & Dashboard:** Allows logging daily metrics with real-time updates and displays avatars, scores, and insights.
-   **Life Zone System:** Tracks progress across 6 predefined zones (Health, Social Emotional, Wealth, Faith, Family, Community) with specific daily inputs and scoring.
-   **Habit Builder & Achievements:** Users can create custom habits, track completions, and earn achievements.
-   **Smart Reassessment & Insights:** The system suggests re-evaluating baselines based on long-term trends and generates personalized insights and pattern recognition.
-   **Micro-Suggestions Engine:** Provides contextual, neutral guidance after daily log submissions using pre-written PTG-style suggestions, comparing current metrics to baselines and averages, with priority ranking for different metrics. Suggestions are stored in Firestore, and a rotation system prevents repetition.
-   **Smart Device Integration Layer:** Enables passive data ingestion from external health devices, prioritizing device data over manual entries.
-   **Progress & Momentum Layer:** Provides features like a personal progress timeline, focus zone indicators, consistency streaks, and weekly reflection prompts, all designed to be supportive and non-judgmental.
-   **Evidence of Value & Signal Clarity:** A system to show users the impact of their actions through "NoticingCard" (personal proof moments), a "Signal Attribution Layer" that explains metric changes, and a "ProgressSnapshot" for sharing.

**Backend & Data Architecture:**

Firebase Authentication v11 manages user authentication. Cloud Firestore is the primary database for all user-related data, including profiles, zone-specific daily logs, habits, and achievements.

## External Dependencies

-   **Firebase Services:**
    -   `firebase`: Core SDK.
    -   `firebase/auth`: User authentication.
    -   `firebase/firestore`: Cloud Firestore database.
-   **UI & Styling Libraries:**
    -   `react`: Frontend UI library.
    -   `react-dom`: React DOM renderer.
    -   `react-router-dom`: Client-side routing.
    -   `framer-motion`: Animations and transitions.
    -   `tailwindcss`: Utility-first CSS framework.
-   **Build Tools:**
    -   `vite`: Frontend tooling.
    -   `@vitejs/plugin-react`: React support for Vite.
    -   `postcss`: CSS transformation.
    -   `autoprefixer`: Adds vendor prefixes to CSS.