# Future Me - Lifestyle Visualization Web App

## Overview

Future Me is a web application designed to visualize a user's future self based on their current lifestyle choices. It achieves this by collecting lifestyle metrics through an interactive questionnaire and dynamically adapting an avatar to reflect health indicators. The core purpose is to engage and motivate users to understand the long-term impact of their daily habits on their well-being. Key capabilities include a legal onboarding flow, a 3-step metric collection, dynamic avatar visualization, real-time wellness score calculation, future self projection, user authentication, and a responsive design.

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

The frontend is built with React 18.3 and Vite 7.1.9, leveraging TailwindCSS 3 for styling with a custom design system. Framer Motion handles animations, and React Router v6 manages client-side routing. The application uses a component-based architecture with the Context API for authentication state. UI/UX decisions prioritize a custom color palette, gradient elements, card-based layouts, and mobile-first responsiveness.

**Technical Implementations & Feature Specifications:**

-   **Onboarding & Metric Collection:** A 3-step questionnaire gathers age, goals, and lifestyle ratings (activity, nutrition, sleep, stress).
-   **Wellness Score Calculation:** A formula calculates a 0-100 score based on lifestyle inputs.
-   **Future Me Avatar System:** An SVG-based avatar dynamically adjusts color, posture, body width, and facial expressions based on wellness scores and metrics.
    -   **Future Avatar Engine:** Projects lifestyle metrics and avatar appearance 90 days into the future, displayed via a toggleable second avatar.
    -   **Enhanced Future Path Predictions:** Calculates 30/90/180-day projections using weighted factors (lifestyle trend, Life Zone scores, habit consistency), displaying status indicators, progress bars, and actionable insights.
    -   **Avatar Trait Map Engine:** Converts user data into 6 visual avatar traits (Posture, Body Shape, Facial Expression, Glow/Energy, Movement Level, Aura/Presence), feeding into rendering logic for dynamic transformations.
    -   **Avatar Effects Engine:** A modular system (`src/components/avatar/AvatarEffectsEngine.js`) translates lifestyle metrics into CSS visual effects (brightness, contrast, saturation, glow, blur) applied via filters and overlays.
    -   **Posture Overlay System:** A modular component (`src/components/avatar/posture/`) displays SVG silhouette overlays (upright, neutral, slump) with Framer Motion transitions based on `postureState`.
    -   **Facial Expression & Emotional Overlay System:** (`src/components/avatar/FacialExpressionLayer.jsx`) renders emotion-based facial overlays (brows, cheeks, mouth) derived from lifestyle metrics, including special indicators for tired/stressed states.
    -   **Gender-Aware Body Composition System (Phase 4+):** (`BodyCompositionLayer.jsx`, `GenderSelector.jsx`) A gender-specific body morphing system with distinct male and female SVG models. Calculates Body Composition Index (activity 60% + nutrition 40%) to determine 3 morph states (soft, balanced, fit) for each gender. Male models feature broader shoulders and V-shape torso; female models use hourglass curvature. Uses Framer Motion for smooth state transitions. Gender selection persists to Firestore and uses localStorage caching for instant hydration to prevent incorrect avatar display on page load. Dashboard gates avatar render until gender is determined (shows loading spinner).
    -   **Energy Glow Layer System:** (`EnergyGlowLayer.jsx`) visualizes energy levels through pulsing aura rings and orbiting particles.
    -   **Photo Effects Layer System (Phase 5):** A non-destructive overlay system (`src/components/avatar/photo/PhotoEffectsLayer.jsx`) that adds subtle lifestyle-based visual cues to uploaded photos without distorting the image. Features five modular overlay effects: Under-Eye Shadow (curved gradient for tiredness), Stress Tint (gray-blue desaturation overlay), Positive Glow (warm gradient from below for high energy/discipline), Clarity Filter (backdrop-filter contrast/brightness boost for good sleep), and Low-Light Vignette (soft radial darkening for fatigue). All effects use percentage-based positioning, threshold-controlled opacity (0.15-0.25 max), pointer-events: none for non-blocking interaction, and Framer Motion fade transitions. Only renders in photo mode.
    -   **Photo/Avatar Toggle System:** A reusable component (`src/components/avatar/AvatarViewToggle.jsx`) allows switching between user photos and the dynamic SVG avatar, integrating all visual effects.
-   **Daily Tracking System:** Enables logging daily metrics (sleep, activity, nutrition, stress) with real-time dashboard updates.
-   **Dashboard Visualization:** Displays current/future avatars, metric bars, wellness scores, goals, and insights.
-   **Life Zone System:** Tracks progress across 6 zones (Health, Social Emotional, Wealth, Faith, Family, Community), each with unique daily log inputs, scoring formulas, and interactive detail modals showing historical data. Zones initialize at 50 points and recalculate scores upon submission.
-   **Habit Builder System:** Users create up to 15 custom habits, track completions, build streaks, and receive zone bonuses. Habits can be linked to Life Zones or tracked as "Personal Habits."
-   **Milestone and Achievement Rewards System:** Automatically tracks 14 achievements across 4 categories (habit mastery, Life Zone excellence, consistency, general progress), triggering visual badges, notifications, and insights.

**Backend & Data Architecture:**

Firebase Authentication v11 provides email/password sign-up, login, and password reset. Cloud Firestore is the primary database.

**Data Schema Highlights:**
-   User profiles are stored at `/users/{userId}`, containing personal info, onboarding status, metrics, and Life Zone scores.
-   **Zone-Specific Daily Logs:** Stored at `/users/{userId}/zoneLogs/{zoneId}/daily/{yyyy-mm-dd}`, each zone has specific metric inputs.
-   **Zone-Specific Scoring Formulas:** Each zone's score is calculated using weighted inputs from its own daily logs, incorporating trend and streak bonuses.
-   User habits are stored in `/users/{userId}/habits/{habitId}` with details like title, linked zone, streak, and completion history.
-   User achievements are stored in `/users/{userId}/achievements/{achievementId}`, including id, name, description, category, and earned timestamp, with idempotent writes to prevent duplicates.

## External Dependencies

### Firebase Services
-   `firebase`: Core Firebase SDK for web.
-   `firebase/auth`: User authentication.
-   `firebase/firestore`: Cloud-based NoSQL database.

### UI & Styling Libraries
-   `react`: Frontend UI library.
-   `react-dom`: React DOM renderer.
-   `react-router-dom`: Client-side routing.
-   `framer-motion`: Animations and transitions.
-   `tailwindcss`: Utility-first CSS framework.

### Build Tools
-   `vite`: Frontend tooling and build system.
-   `@vitejs/plugin-react`: React support for Vite.
-   `postcss`: CSS transformation.
-   `autoprefixer`: Adds vendor prefixes to CSS.