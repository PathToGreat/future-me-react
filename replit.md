# Future Me - Lifestyle Visualization Web App

## Overview

Future Me is a web application designed to motivate users by visualizing their future self based on current lifestyle choices. It dynamically adapts an avatar using an interactive questionnaire and real-time feedback, illustrating the long-term impact of daily habits on well-being. The project focuses on personal development and discipline, offering features like legal onboarding, dynamic avatar visualization, wellness scoring, and future self projection. It aims to provide insights and tools for personal growth without relying on mystical concepts.

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
-   **Dynamic Avatar System:** SVG-based avatar (Current Me vs. Future Me) visually adjusts based on wellness scores and metrics, incorporating visual overlays for posture and expressions. An Avatar Input Routing Gateway manages inputs.
-   **Wellness Score Calculation:** A formula calculates a 0-100 score from user inputs.
-   **Daily Tracking & Dashboard:** For logging metrics, displaying avatars, scores, and insights.
-   **Life Zone System:** Tracks progress across 6 key areas: Health, Social Emotional, Wealth, Faith, Family, and Community.
-   **Habit Builder & Achievements:** Allows custom habit creation, tracking, and achievement recognition.
-   **Smart Reassessment & Insights:** Suggests baseline re-evaluation and generates personalized insights.
-   **Micro-Suggestions Engine:** Provides contextual guidance after daily logs based on metric comparisons.
-   **Smart Device Integration Layer:** Enables passive data ingestion from external health devices.
-   **Progress & Momentum Layer:** Features a personal progress timeline, focus zone indicators, and consistency streaks.
-   **Commitment & Retention Layer:** Encourages user engagement without gamification.
-   **Clarity, Trust, and Sharability Layer:** Enhances user understanding and sharing with features like "WhatThisMeans Panel" and "ProgressSnapshot 'What Changed' View."
-   **Monthly Snapshot Memory:** Stores a monthly reflective record of user progress.
-   **Trend Intelligence Layer:** Utilizes a Pattern Detection Engine to provide neutral, evidence-based insights.
-   **Personal Operating Style:** Aggregates trusted patterns into data-driven user profiles.
-   **Avatar Expressive Resolution & State Attribution:** Maps internal states to visual avatar manifestations and trajectory detection.
-   **Counterfactual Future-State Projection:** Allows users to explore hypothetical avatar states in session-only mode.
-   **Commitment Translation (User-Initiated):** Enables users to translate exploration insights into self-directed commitments.
-   **Intelligent Reflection Reminders:** Opt-in reminder system triggered by meaningful state changes.
-   **Multi-Zone Visual Integration Layer:** Avatar rendering pipeline subtly incorporates influences from all 6 Life Zones.
-   **Identity Trajectory Engine (ITE):** A foundational predictive architecture deriving 7 identity traits (e.g., Vitality, Resilience) from raw metrics and life zone scores, providing current scores, projections, and narrative summaries.
-   **ITE Avatar Routing:** Routes avatar state through the ITE when sufficient data is available.
-   **Trait-Based Reflections & Insights:** Shifts insights and reflections from raw metric reporting to identity trajectory interpretation.
-   **Action-to-Identity Consequence Wiring:** Maps user actions to identity trait impacts, providing conservative impact estimates.
-   **Current vs Future Identity Contrast Engine:** Computes and displays identity contrast between "Current Me" and "Future Me".
-   **Trajectory Scenario Engine:** Defines 8 controlled counterfactual scenarios and simulates conservative velocity adjustments on ITE outputs.
-   **First Week Acceleration Engine:** Ensures meaningful identity feedback starting Day 1 by adjusting ITE gating, velocity computation, projection, and narrative generation during early usage.
-   **Human Avatar Rendering Pipeline:** Renders a full-body SVG avatar with anatomically-proportioned geometry, facial features, hair layers, energy glow, and shading, supporting skin tone and hair style customization.
-   **Body Model Integrity & Cross-Gender Robustness:** Replaces composite identity score with `PhysicalCompositionScore` for body shape, with emotional traits driving posture, facial tension, vibrancy, and glow. Includes gender-specific adjustments and structural integrity checks.
-   **Projection Credibility & Release Stabilization:** Computes confidence tiers for projections (LOW, MEDIUM, HIGH) and applies scaling and narrative adjustments accordingly, ensuring visual and narrative consistency.
-   **Avatar V2 Visual Clean-up + Calm Face Mapping + Hair Fix + Gender Lock:** Addresses visual artifacts, refines facial tension mapping, redesigns hair styles (short, medium, long), and implements a gender lock feature for existing users.
-   **Long Hair + Hair Color Palette:** Adds a "Long" hair style and an 8-color hair palette, with persistence to local storage.
-   **Ghost Silhouette Removal + Long Hair Face Fix (Phase 24):** Eliminates a faint ghost outline from the avatar rendering and fixes long hair occlusion of the face by splitting hair into back and crown layers.
-   **Halo Removal + Anatomical Depth (Phase 25):** (A) Halo eliminated — in `FutureMeAvatar.jsx` and `FutureAvatar.jsx`, aura rings (`radial-gradient` divs with `scale` transforms), glow overlay (`blur-2xl` div scaled 1.5x), `getGlowOverlayStyle` blur layer (`inset: -20px`), `getDarknessOverlayStyle` overlay, and V1 layer components (`PostureLayer`, `FacialExpressionLayer`, `EnergyGlowLayer`, `BodyCompositionLayer`) are all gated behind `!USE_HUMAN_AVATAR_V2` so they never render when V2 is active. (B) Anatomical depth — `AnatomicalDepthLayer` component added to `HumanAvatarRenderer.jsx` with 4 subtle cues: shoulder plane highlight (white curved path, opacity 0.07), collarbone suggestion (black curved path, opacity 0.06), torso center highlight (white ellipse, opacity 0.04), and arm inner-edge taper lines (black, opacity 0.05). All cues use absolute colors (black/white) at near-invisible opacity so they work across all skin tones. Rendered after body fills, before hair/face. Both mini and full renderers include the depth layer.

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