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
-   **Home Dashboard Hierarchy:** Restructured for clarity and emotional impact. Visual hierarchy: MiniAvatarPreview (emotional anchor) → Today's Reflection (dominant card) → DirectionIndicator (trajectory readout) → Weekly Trend Summary → Monthly Snapshot entry → Quick Log Button → collapsible sections. Below Quick Log, two collapsible sections: "Progress & Details" (contains FutureSelfPreview, ReassessmentBanner, OperatingStyleCard, MicroSuggestionCard, ProgressTimeline, ConsistencyStreaks, Progress Snapshot link; also shows compact status row: Profile/Assessment/Tracking days) and "Insights" feed (InsightsFeed with InsightItem; persisted to Firestore at users/{uid}/insightsFeed/{insightId}; shows unread count; patterns, changes, and reflections normalized into a single feed). Both collapsed by default. No streak/celebration language on main Home surface. MiniAvatarPreview renders a compact SVG avatar reflecting current state (posture, expression, energy color) using the same avatar engine; tappable to navigate to full Avatar tab. "Today's Reflection" dynamically selects the highest-priority insight from pattern detection, observed changes, daily insights, and focus zone data. Displays ONE insight at a time with icon, headline, supporting sentence, and optional expandable "Why this matters" section with context-aware "Try this" micro-suggestion.
-   **Life Zone System:** Tracks progress across 6 zones (Health, Social Emotional, Wealth, Faith, Family, Community).
-   **Habit Builder & Achievements:** Allows users to create custom habits, track completions, and earn achievements.
-   **Smart Reassessment & Insights:** Suggests baseline re-evaluation and generates personalized insights.
-   **Micro-Suggestions Engine:** Provides contextual, neutral guidance after daily logs, comparing metrics to baselines and averages. Suggestions are stored in Firestore.
-   **Smart Device Integration Layer:** Enables passive data ingestion from external health devices.
-   **Progress & Momentum Layer:** Features a personal progress timeline, focus zone indicators, consistency streaks, and weekly reflection prompts.
-   **Commitment & Retention Layer:** Features designed to encourage natural return and psychological commitment without gamification, such as "DailyReasonToReturn," "FirstMeaningfulWin," and "GentleCommitmentPrompt."
-   **Clarity, Trust, and Sharability Layer:** Features like "WhatThisMeans Panel," "ProgressSnapshot 'What Changed' View," and "HowPeopleUseThis Card" to enhance user understanding and sharing.
-   **Monthly Snapshot Memory:** Once-per-month reflective record stored in Firestore (`users/{uid}/monthlySnapshots/{YYYY-MM}`). Contains start/end avatar state comparison, top pattern shift, strongest/most sensitive zone summary, direction, and 1-2 sentence summary. Requires 7+ logged days to generate. Past months browsable from within snapshot screen. No badges, streaks, or celebratory language.
-   **Trend Intelligence Layer:** Data-driven pattern detection via a Pattern Detection Engine, surfacing neutral, evidence-based insights via the TodaysReflection card on the Home screen.
-   **Pattern Validation & Language Lock:** Internal evaluation layer to validate patterns and lock language based on user interaction (expansion/dismissal rates).
-   **Personal Operating Style:** Aggregates trusted patterns into data-driven user profiles (e.g., Recovery Sensitive, Stress Reactive) and displays them via an OperatingStyleCard.
-   **Avatar Expressive Resolution & State Attribution:** Enhances avatar visual vocabulary and state attribution, mapping internal states (energy, stressLoad) to visual manifestations (posture, expressions) and trajectory detection. Operating Styles subtly influence visual expression.
-   **Avatar Interpretability & Visual Legibility:** Refines avatar expressions for clearer distinction between states, ensures consistency, resolves conflicting signals, and maintains trust by avoiding judgmental or speculative visuals.
-   **Counterfactual Future-State Projection:** Exploration mode for hypothetical avatar states without altering real data. Session-only state management with preset scenarios (Balanced Wellness, Recovery Focused, Active Lifestyle, Structured Routine, Stress Reduction). Visually differentiates projected state with subtle overlay and restraint. Clean entry/exit with guaranteed state restoration.
-   **Commitment Translation (User-Initiated):** Optional system allowing users to translate exploration insights into gentle, self-directed commitments. Reflection gate appears after exiting projection mode (can be permanently dismissed). User-controlled duration (7/14/30 days) and focus type derived from explored scenario. Commitments function as intent markers only—no enforcement, penalties, rewards, or avatar modifications. Soft contextual acknowledgment via observational cards when progress aligns with focus (max 3 per commitment, descriptive language only).
-   **Intelligent Reflection Reminders:** Opt-in reminder system that only triggers on meaningful state changes — not daily logging or streaks. Triggers: direction status change (Strengthening/Stable/Declining), new high-confidence pattern detected, monthly snapshot available, major baseline shift. Reminders stored in Firestore at `users/{uid}/reminders/{reminderId}` with deduplication (same trigger+date won't repeat). User preferences at `users/{uid}/settings/reminders` (default OFF, per-type toggles). In-app ReminderBanner appears at top of Home dashboard — subtle slate-50 styling, dismissible, never auto-repeats. ReminderSettings modal accessible from Menu > Reflection Reminders. Tone: calm, factual, no urgency or guilt.

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