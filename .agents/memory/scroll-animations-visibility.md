---
name: Scroll-triggered animations invisible in preview iframe
description: Why whileInView/IntersectionObserver reveal animations can leave content permanently hidden for this app's users
---

Rule: On public-facing pages of this app, use mount-triggered animations (`animate` with optional delay), never scroll-triggered reveals (`whileInView` / IntersectionObserver with `initial opacity: 0`).

**Why:** Users view the app through the Replit canvas/preview iframe (cross-origin) and mobile webviews where the viewport observer never fired — all `whileInView` sections stayed at opacity 0 and the user reported "nothing else is visible" below the hero, while the agent's own screenshot looked fine. The hero was visible only because it used plain `animate`.

**How to apply:** If content must start hidden for an entrance effect, trigger it on mount (`animate` + `transition.delay`), matching the existing hero pattern. If a scroll reveal is ever truly needed, it must degrade to visible-by-default when the observer doesn't fire.
