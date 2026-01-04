# Future Me - Lifestyle Visualization Web App

## Overview

Future Me is a web application that visualizes a user's future self based on current lifestyle choices. It collects lifestyle metrics via an interactive questionnaire and dynamically adapts an avatar to reflect health indicators. The main goal is to engage and motivate users to understand the long-term impact of their daily habits on their well-being. Key features include legal onboarding, 6-step metric collection, dynamic avatar visualization, real-time wellness scoring, future self projection, user authentication, and a responsive design. The project aims to provide a practical tool for personal development, growth, and discipline, avoiding mystical or new-age concepts.

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

The frontend uses React 18.3, Vite 7.1.9, TailwindCSS 3 for styling, Framer Motion for animations, and React Router v6 for routing. It employs a component-based architecture with the Context API for authentication and shared state. UI/UX emphasizes a custom color palette, gradients, card-based layouts, and mobile-first responsiveness, featuring a multi-screen mobile architecture with persistent bottom navigation.

**Key Features and Design Patterns:**

-   **Multi-Screen Architecture:** Five main screens (Home, Avatar, Habits, Metrics, Menu) with consistent navigation.
-   **Onboarding & Metric Collection:** A 6-step questionnaire for initial data input.
-   **Dynamic Avatar System:** SVG-based avatar adjusting visual traits based on wellness scores and metrics. Includes "Current Me" (baseline) vs. "Future Me" (90-day projection), avatar engines for visual traits, and visual overlays for posture, expressions, and effects. An Avatar Input Routing Gateway controls which inputs affect each avatar.
-   **Wellness Score Calculation:** A formula computes a 0-100 score from user inputs.
-   **Daily Tracking & Dashboard:** For logging daily metrics, real-time updates, and displaying avatars, scores, and insights.
-   **Life Zone System:** Tracks progress across 6 zones (Health, Social Emotional, Wealth, Faith, Family, Community).
-   **Habit Builder & Achievements:** Allows users to create custom habits, track completions, and earn achievements.
-   **Smart Reassessment & Insights:** Suggests baseline re-evaluation and generates personalized insights.
-   **Micro-Suggestions Engine:** Provides contextual, neutral guidance after daily logs, comparing metrics to baselines and averages. Suggestions are stored in Firestore.
-   **Smart Device Integration Layer:** Enables passive data ingestion from external health devices.
-   **Progress & Momentum Layer:** Features a personal progress timeline, focus zone indicators, consistency streaks, and weekly reflection prompts.
-   **Commitment & Retention Layer:** Features designed to encourage natural return and psychological commitment without gamification, such as "DailyReasonToReturn," "FirstMeaningfulWin," and "GentleCommitmentPrompt."
-   **Clarity, Trust, and Sharability Layer:** Features like "WhatThisMeans Panel," "ProgressSnapshot 'What Changed' View," and "HowPeopleUseThis Card" to enhance user understanding and sharing.
-   **Trend Intelligence Layer:** Data-driven pattern detection via a Pattern Detection Engine, surfacing neutral, evidence-based insights as PatternCards on the Home screen.
-   **Pattern Validation & Language Lock:** Internal evaluation layer to validate patterns and lock language based on user interaction (expansion/dismissal rates).
-   **Personal Operating Style:** Aggregates trusted patterns into data-driven user profiles (e.g., Recovery Sensitive, Stress Reactive) and displays them via an OperatingStyleCard.
-   **Avatar Expressive Resolution & State Attribution:** Enhances avatar visual vocabulary and state attribution, mapping internal states (energy, stressLoad) to visual manifestations (posture, expressions) and trajectory detection. Operating Styles subtly influence visual expression.
-   **Avatar Interpretability & Visual Legibility:** Refines avatar expressions for clearer distinction between states, ensures consistency, resolves conflicting signals, and maintains trust by avoiding judgmental or speculative visuals.

**Backend & Data Architecture:**

Firebase Authentication manages user authentication. Cloud Firestore is the primary database for all user-related data.

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