# Future Me - Lifestyle Visualization Web App

## Overview

Future Me is a web application designed to visualize a user's future self by dynamically adapting an avatar based on current lifestyle choices. It aims to motivate users by illustrating the long-term impact of their daily habits on well-being through an interactive questionnaire and real-time feedback. The project focuses on personal development and discipline, avoiding mystical concepts, and provides features like legal onboarding, dynamic avatar visualization, wellness scoring, and future self projection.

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

The frontend is built with React 18.3, Vite, TailwindCSS, Framer Motion, and React Router v6, utilizing a component-based architecture with the Context API for state management. UI/UX emphasizes a custom color palette, card-based layouts, and mobile-first responsiveness.

**Core Architectural Decisions and Features:**

-   **Multi-Screen Architecture:** Consistent navigation across five main screens (Home, Avatar, Habits, Metrics, Menu).
-   **Dynamic Avatar System:** SVG-based avatar (Current Me vs. Future Me) that visually adjusts based on wellness scores and metrics, incorporating visual overlays for posture and expressions. An Avatar Input Routing Gateway manages inputs.
-   **Wellness Score Calculation:** A formula calculates a 0-100 score from user inputs.
-   **Daily Tracking & Dashboard:** For logging metrics, displaying avatars, scores, and insights. The Home Dashboard prioritizes emotional anchors and includes collapsible sections for "Progress & Details" and "Insights."
-   **Life Zone System:** Tracks progress across 6 key areas: Health, Social Emotional, Wealth, Faith, Family, and Community.
-   **Habit Builder & Achievements:** Allows custom habit creation, tracking, and achievement recognition.
-   **Smart Reassessment & Insights:** Suggests baseline re-evaluation and generates personalized insights.
-   **Micro-Suggestions Engine:** Provides contextual guidance after daily logs based on metric comparisons.
-   **Smart Device Integration Layer:** Enables passive data ingestion from external health devices.
-   **Progress & Momentum Layer:** Features a personal progress timeline, focus zone indicators, and consistency streaks.
-   **Commitment & Retention Layer:** Encourages user engagement through features like "DailyReasonToReturn" and "GentleCommitmentPrompt," without gamification.
-   **Clarity, Trust, and Sharability Layer:** Enhances user understanding and sharing with features like "WhatThisMeans Panel" and "ProgressSnapshot 'What Changed' View."
-   **Monthly Snapshot Memory:** Stores a monthly reflective record of user progress, including avatar states and key pattern shifts.
-   **Trend Intelligence Layer:** Utilizes a Pattern Detection Engine to provide neutral, evidence-based insights via the Home screen's "Today's Reflection" card.
-   **Personal Operating Style:** Aggregates trusted patterns into data-driven user profiles (e.g., Recovery Sensitive, Stress Reactive).
-   **Avatar Expressive Resolution & State Attribution:** Maps internal states (energy, stressLoad) to visual avatar manifestations and trajectory detection.
-   **Counterfactual Future-State Projection:** Allows users to explore hypothetical avatar states in session-only mode, without altering real data.
-   **Commitment Translation (User-Initiated):** Enables users to translate exploration insights into self-directed commitments, functioning as intent markers without enforcement or rewards.
-   **Intelligent Reflection Reminders:** Opt-in reminder system triggered by meaningful state changes (e.g., direction status change, new patterns, monthly snapshot availability).
-   **Multi-Zone Visual Integration Layer:** Avatar rendering pipeline subtly incorporates influences from all 6 Life Zones, with Health remaining the primary driver.
-   **Identity Trajectory Engine (ITE):** A foundational predictive architecture that derives 7 identity traits (e.g., Vitality, Resilience) from raw metrics and life zone scores, providing current scores, projections, and narrative summaries.
-   **ITE Avatar Routing:** Routes avatar state through the ITE when sufficient data is available, adapting trait scores into existing avatar input formats for both "Current" and "Future" views.
-   **Trait-Based Reflections & Insights:** Shifts insights and reflections from raw metric reporting to identity trajectory interpretation, framing them in identity trait language.
-   **Action-to-Identity Consequence Wiring:** Maps user actions to identity trait impacts, providing conservative impact estimates and generating consequence lines for "Try This" suggestions.
-   **Current vs Future Identity Contrast Engine:** Computes and displays identity contrast when toggling between "Current Me" and "Future Me" on the Avatar screen, highlighting top gains/losses and sensitive traits.
-   **Trajectory Scenario Engine (Phase 15):** `scenarioLibrary.js` defines 8 controlled counterfactual scenarios (SleepConsistency14d, DailyWalk14d, NutritionStability14d, StressDecompression10d, StrengthTraining14d, SocialConnection7d, LoggingPause10d, LateNights7d). `trajectoryScenarioEngine.js` simulates conservative velocity adjustments on ITE outputs, producing scenario narratives and trait deltas. AvatarScreen Future Me view shows one default scenario suggestion line. No new UI sections.
-   **First Week Acceleration Engine (Phase 16):** Ensures meaningful identity feedback starting Day 1. `detectEarlyStage()` in identityTrajectoryEngine checks history < 7 entries OR days since first log < 7. When earlyStage=true: ITE gating reduced from 3 logs to 1; velocity computation uses baseline-weighted approach (60% baseline delta, 40% short-term) with lower direction threshold (1.0 vs 1.5); projection engine uses simplified slope from baseline delta + velocity with stronger damping (0.88 vs 0.92); narrative engine uses emergence language ("Early signals show...", "Initial patterns indicate..."); trajectory intensity thresholds lowered (strengthening at 30 vs 40, drifting at 28 vs 35); confrontation tone suppressed in first 3 days; scenario engine always generates one default positive scenario even with 1 log. projectionConfidence="early" included in narrative output (internal only). No fabricated data — only sensitivity adjustments.
-   **Human Avatar Rendering Pipeline (Phases 18-19):** `HumanAvatarRenderer.jsx` renders full-body SVG avatar with anatomically-proportioned body geometry, facial features, hair layers, energy glow, and shading. Supports `mini` mode (no motion/filters, unique SVG IDs) for `MiniAvatarPreview`. `avatarParams.js` defines `SKIN_TONE_PALETTE` (7 tones) and normalization. `mapTraitsToAvatarParams.js` provides `mapFromAvatarEffects` (current view), `mapFromAvatarEffectsProjected` (future view with ITE projection blending at 0.35), and `computePhotoOverlayState` (photo mode filter shifts from trait deltas). `SkinToneSelector.jsx` persists skin tone and hair style to localStorage. `PhotoFutureOverlay.jsx` renders saturation/brightness/contrast/warmth, skin glow, vignette, and under-eye overlay layers for photo mode Future view. `VisualInfluences.jsx` integrates `SkinToneSelector` within the collapsible panel. `AvatarScreen.jsx` manages appearance state and passes `skinTone`/`hairStyle` props to both `FutureMeAvatar` and `FutureAvatar`. `USE_HUMAN_AVATAR_V2 = true` feature flag with legacy V1 SVG fallback preserved. Console logs removed from avatar components.

**Backend & Data Architecture:** Firebase Authentication is used for user authentication, and Cloud Firestore serves as the primary database for all user data.

## External Dependencies

-   **Firebase Services:**
    -   `firebase`: Core SDK
    -   `firebase/auth`: User authentication
    -   `firebase/firestore`: Cloud Firestore database
-   **UI & Styling Libraries:**
    -   `react`: Frontend UI library
    -   `react-dom`: React DOM renderer
    -   `react-router-dom`: Client-side routing
    -   `framer-motion`: Animations and transitions
    -   `tailwindcss`: Utility-first CSS framework
-   **Build Tools:**
    -   `vite`: Frontend tooling
    -   `@vitejs/plugin-react`: React support for Vite
    -   `postcss`: CSS transformation
    -   `autoprefixer`: Adds vendor prefixes to CSS