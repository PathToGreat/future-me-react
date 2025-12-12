# Future Me - Lifestyle Visualization Web App

## Overview

Future Me is a web application designed to visualize a user's future self based on their current lifestyle choices. It collects lifestyle metrics through an interactive questionnaire and dynamically adapts an avatar to reflect health indicators. The core purpose is to engage and motivate users to understand the long-term impact of their daily habits on their well-being. Key capabilities include legal onboarding, 6-step metric collection, dynamic avatar visualization, real-time wellness score calculation, future self projection, user authentication, and a responsive design.

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

The frontend uses React 18.3, Vite 7.1.9, TailwindCSS 3 for styling, Framer Motion for animations, and React Router v6 for routing. It employs a component-based architecture with the Context API for authentication and shared state. UI/UX emphasizes a custom color palette, gradients, card-based layouts, and mobile-first responsiveness.

**Multi-Screen Mobile Architecture (December 2025):**
-   **Screen Structure:** The app uses a multi-screen layout with persistent bottom navigation instead of a single scrolling dashboard.
-   **Screens:** Home (daily overview, micro-insights), Avatar (current/future visualization), Habits (habit management, achievements), Metrics (daily logging, Life Zones), Menu (settings, devices, logout).
-   **Navigation:** `BottomNavigation.jsx` provides a 5-tab bar with animated active state indicators.
-   **State Management:** `AppContext.jsx` centralizes shared state (profile, habits, achievements, metrics) across all screens.
-   **Layout:** `MainLayout.jsx` wraps all screens with the bottom navigation and provides smooth screen transitions.

**Technical Implementations & Feature Specifications:**

-   **Onboarding & Metric Collection:** A 6-step questionnaire covers goals, core habits (activity, nutrition, sleep, stress), physical state, lifestyle rhythm, emotional profile, and faith/purpose.
-   **Wellness Score Calculation:** A formula calculates a 0-100 score based on lifestyle inputs.
-   **Future Me Avatar System:** An SVG-based avatar dynamically adjusts visual traits (color, posture, body width, facial expressions, glow, movement, aura) based on wellness scores and metrics.
    -   **Current Me vs Future Me Architectural Separation:** The "Current Me" avatar is anchored to `onboardingBaseline` metrics and changes slowly over time, while the "Future Me" avatar is a 90-day projection based on daily log trends, Life Zone scores, and habit consistency.
    -   **Future Avatar Engine:** Projects lifestyle metrics and avatar appearance 90 days into the future.
    -   **Avatar Trait Map Engine & Effects Engine:** Convert user data into visual traits and CSS visual effects (brightness, contrast, saturation, glow, blur).
    -   **Posture Overlay System:** Displays SVG silhouette overlays based on `postureState`.
    -   **Facial Expression & Emotional Overlay System:** Renders emotion-based facial overlays.
    -   **Gender-Aware Body Composition System:** A gender-specific body morphing system with distinct male and female SVG models, calculating 3 morph states (soft, balanced, fit) based on activity and nutrition.
    -   **Energy Glow Layer System:** Visualizes energy levels through pulsing aura rings and orbiting particles.
    -   **Photo Effects Layer System:** Adds subtle, non-destructive visual cues to uploaded photos based on lifestyle metrics (e.g., Under-Eye Shadow for tiredness, Positive Glow for high energy).
    -   **Photo/Avatar Toggle System:** Allows switching between user photos and the dynamic SVG avatar.
-   **Daily Tracking System:** Enables logging daily metrics with real-time dashboard updates.
-   **Dashboard Visualization:** Displays current/future avatars, metric bars, wellness scores, goals, and insights.
-   **Life Zone System:** Tracks progress across 6 zones (Health, Social Emotional, Wealth, Faith, Family, Community), each with unique daily log inputs and scoring formulas.
-   **Habit Builder System:** Users create custom habits, track completions, and earn zone bonuses.
-   **Milestone and Achievement Rewards System:** Tracks 14 achievements across various categories, triggering visual badges and notifications.
-   **Smart Reassessment Suggestion System:** Monitors long-term trends in daily logs and suggests re-evaluating baseline metrics when significant changes are detected.
-   **Insights Engine System:** Generates personalized suggestions and pattern recognition (Daily, Weekly, Monthly) based on user data, prioritizing insights.
-   **Micro-Suggestions Engine:** (`src/utils/microSuggestionsEngine.js`, `src/components/MicroSuggestionCard.jsx`) Generates contextual, PTG-style neutral guidance after each daily log submission.
    -   **50 Pre-Written PTG Suggestions:** Curated library of suggestions acknowledging effort, discipline, and awareness without value judgments. Examples: "That takes self-discipline to keep tracking consistently", "Maintaining awareness here takes commitment", "Observing patterns like this takes self-awareness".
    -   **Metric Coverage:** Generators for sleep, activity, nutrition, stress, hydration, emotional, faith, energy, and routine metrics with template interpolation ({current}, {baseline}, {variance}).
    -   **Comparison Logic:** Compares current log metrics against onboarding baseline and rolling 7-day averages.
    -   **Priority Ranking:** Sleep > Stress > Activity > Nutrition order ensures most impactful metrics surface first.
    -   **Combined Pattern Detection:** Identifies cross-zone interactions including lowEnergySleepIssue, multipleStressors, overallImproving, balancedPositive, nutritionHydrationSynergy, and overallComplete patterns.
    -   **PTG-Style Language:** All suggestions use neutral, descriptive language without value judgments (e.g., "Sleep duration logged at 5.5 hours. Baseline is 7 hours. That takes self-discipline to keep tracking consistently.").
    -   **Fallback System:** Guarantees valid suggestion output even with empty/null data scenarios with consistent fallback messaging.
    -   **Firestore Persistence:** Suggestions stored at `/users/{userId}/microSuggestions/{yyyy-mm-dd}` for dashboard display and historical reference.
    -   **Rotation Tracking System:** Prevents suggestion repetition within 24-hour window using Firestore-persisted rotation history at `/users/{userId}/suggestionHistory/rotation`. Uses `hashSuggestion()` to create unique IDs (ignoring numeric values), `loadSuggestionHistory()` hydrates in-memory cache on component load, `getSuggestionHistoryForPersistence()` exports current history for Firestore storage after each suggestion generation.
    -   **Source Labels:** Each suggestion includes a source label (e.g., "Based on your sleep log today") displayed in MicroSuggestionCard for transparency.
    -   **Expandable Card UI:** MicroSuggestionCard component with zone-specific icons (💪 activity, 💤 sleep, ⚖️ stress, 💧 hydration, 📖 faith, ⭐ energy, 🎯 routine), priority categorization (attention/positive/neutral), and expand/collapse details.
-   **Smart Device Integration Layer:** Enables passive data ingestion from external health devices like Apple Health, Google Fit, Fitbit, Garmin, and Oura Ring, with device-sourced data taking precedence over manual entries.
-   **Avatar Input Routing Gateway:** (`src/config/avatarRoutingRules.json`, `src/utils/avatarInputInterceptor.js`, `src/utils/avatarStateManager.js`, `src/components/DeveloperInspectorPanel.jsx`) Controls exactly which inputs affect Current Me avatar vs Future Me preview.
    -   **Routing Rules Engine:** JSON configuration defines two categories: `current_me_affects` (long-term traits: age, height, body frame, gender, ethnicity, onboardingBaseline) and `future_me_affects` (daily habits: sleep, activity, nutrition, stress, hydration, faith actions, device data).
    -   **Input Interceptor Layer:** All user-entered and device data passes through this layer before reaching avatar calculations. Checks routing rules and routes data to correct pipeline. Blocks daily logs and device data from modifying Current Me baseline.
    -   **Avatar State Manager:** Current Me is a "locked baseline" object that can only be updated via onboarding or reassessment. Future Me is a "dynamic projection" object recalculated when habits change. Provides lock/unlock/validate functions for baseline integrity.
    -   **Developer Inspector Panel:** Hidden debug panel (Shift+M keyboard shortcut) showing all intercepted inputs, routing decisions (Current Me/Future Me/Blocked), blocked attempts log, real-time avatar state, and routing statistics.
    -   **Routing Test Mode:** Toggle within inspector panel enables simulating fake inputs to verify routing behavior without affecting user data. Includes quick test buttons for daily log batch, Current Me input, device input, and blocked input scenarios.
    -   **Integration Points:** Interceptor integrated into DailyTracking (daily log submission), Onboarding (baseline initialization), and deviceDataMerger (device data processing) without modifying existing avatar calculators.

**Backend & Data Architecture:**

Firebase Authentication v11 handles user authentication. Cloud Firestore is the primary database for user profiles, zone-specific daily logs, habits, and achievements.

**Data Schema Highlights:**
-   User profiles: `/users/{userId}` stores personal info, onboarding status, metrics, and Life Zone scores.
-   Zone-Specific Daily Logs: `/users/{userId}/zoneLogs/{zoneId}/daily/{yyyy-mm-dd}`.
-   Habits: `/users/{userId}/habits/{habitId}`.
-   Achievements: `/users/{userId}/achievements/{achievementId}`.

## External Dependencies

### Firebase Services
-   `firebase`: Core Firebase SDK.
-   `firebase/auth`: User authentication.
-   `firebase/firestore`: Cloud Firestore database.

### UI & Styling Libraries
-   `react`: Frontend UI library.
-   `react-dom`: React DOM renderer.
-   `react-router-dom`: Client-side routing.
-   `framer-motion`: Animations and transitions.
-   `tailwindcss`: Utility-first CSS framework.

### Build Tools
-   `vite`: Frontend tooling.
-   `@vitejs/plugin-react`: React support for Vite.
-   `postcss`: CSS transformation.
-   `autoprefixer`: Adds vendor prefixes to CSS.