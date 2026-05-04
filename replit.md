# Future Me - Lifestyle Visualization Web App

## Overview

Future Me is a web application designed to motivate users by visualizing their future self based on current lifestyle choices. It dynamically adapts an avatar using an interactive questionnaire and real-time feedback, illustrating the long-term impact of daily habits on well-being. The project focuses on personal development and discipline, offering features like legal onboarding, dynamic avatar visualization, wellness scoring, and future self projection. It aims to provide insights and tools for personal growth without relying on mystical concepts. The business vision is to empower individuals to make informed lifestyle choices, fostering personal growth and discipline for a healthier future.

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

The frontend is built with React 18.3, Vite, TailwindCSS, Framer Motion, and React Router v6, utilizing a component-based architecture with the Context API for state management. UI/UX emphasizes a custom color palette, card-based layouts, and mobile-first responsiveness. The backend uses Firebase for authentication and Cloud Firestore for data storage.

**Core Architectural Decisions and Features:**

-   **Multi-Screen Architecture:** Consistent navigation across five main screens (Home, Avatar, Habits, Metrics, Menu).
-   **Dynamic Avatar System:** An SVG-based avatar (Current Me vs. Future Me) visually adjusts based on wellness scores and metrics, incorporating visual overlays for posture and expressions. An Avatar Input Routing Gateway manages inputs.
-   **Wellness Score Calculation:** A formula calculates a 0-100 score from user inputs.
-   **Life Zone System:** Tracks progress across 6 key areas: Health, Social Emotional, Wealth, Faith, Family, and Community.
-   **Habit Builder & Achievements:** Allows custom habit creation, tracking, and achievement recognition.
-   **Smart Reassessment & Insights:** Suggests baseline re-evaluation and generates personalized insights.
-   **Micro-Suggestions Engine:** Provides contextual guidance after daily logs based on metric comparisons.
-   **Intelligent Reflection Reminders:** Opt-in reminder system triggered by meaningful state changes.
-   **Identity Trajectory Engine (ITE):** A foundational predictive architecture deriving 7 identity traits (e.g., Vitality, Resilience) from raw metrics and life zone scores, providing current scores, projections, and narrative summaries.
-   **ITE Avatar Routing:** Routes avatar state through the ITE when sufficient data is available.
-   **Trait-Based Reflections & Insights:** Shifts insights and reflections from raw metric reporting to identity trajectory interpretation.
-   **Current vs Future Identity Contrast Engine:** Computes and displays identity contrast between "Current Me" and "Future Me".
-   **Trajectory Scenario Engine:** Defines 8 controlled counterfactual scenarios and simulates conservative velocity adjustments on ITE outputs.
-   **First Week Acceleration Engine:** Ensures meaningful identity feedback starting Day 1 by adjusting ITE gating, velocity computation, projection, and narrative generation during early usage.
-   **Human Avatar Rendering Pipeline:** Renders a full-body SVG avatar with anatomically-proportioned geometry, facial features, hair layers, energy glow, and shading, supporting skin tone and hair style customization. This includes advanced features like anatomical depth, refined facial expressiveness, and a semi-realistic posture layer.
-   **Photo Mode Transformation Layer:** A unified photo overlay system that applies saturation, brightness, contrast, warmth, vignette, skinGlow, underEye, and framing effects tied to posture and ITE data.
-   **Default Habit → Identity Trait Data-Flow:** Connects habit completion data to the ITE/avatar pipeline via a habit influence engine that computes rhythm scores and applies trait boosts.

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