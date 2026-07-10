---
name: Logging, baseline & trait-system gotchas
description: Non-obvious structural facts about how Future Me collects input, sets baseline, and derives traits — needed before any logging/baseline/scoring redesign.
---

# Logging, baseline & trait-system gotchas

Established during a read-only audit of the input/baseline/trait pipeline. These are easy-to-miss relationships that span many files.

## Two coexisting trait systems (don't assume one is dead)
- `utils/avatarTraitEngine.js` `calculateAvatarTraits()` → 6 **visual** traits: posture, bodyShape, facialExpression, glowEnergy, movementLevel, auraPresence. Fed by wellnessScore + dailyMetrics + lifeZones + habitStreaks + achievements.
- The **ITE** (`utils/identityTrajectoryEngine.js` → `identityStateEngine.js` → `traitMappingTable.js`) → 7 **identity** traits: vitality, resilience, emotionalStability, discipline, confidence, socialConnectedness, purposeAlignment (weights per trait sum to 1.0).
- Both are live and both feed the avatar renderer (FutureAvatar passes `avatarTraits` AND `iteResult` into `mapTraitsToAvatarParams`). They use different weightings, so visual state and identity/narrative can drift out of sync.

## ITE baseline is partial
`extractBaselineScore` in `identityStateEngine.js` only maps onboarding activity/sleep/nutrition/stress → vitality/resilience/emotionalStability. discipline, confidence, socialConnectedness, purposeAlignment have EMPTY baseline arrays → default to 50. So their velocity/projection is anchored at neutral regardless of the rich onboarding data (purposeAlignment, faithRhythm, socialSupport, etc.), which is collected but not used for those baselines.

## Daily log == Health zone (duplication)
`DailyTracking.jsx` collects the same 4 fields (activity, nutrition, sleep, stress, 1-5) as the Health life-zone and writes BOTH `zoneLogs/health/daily/{date}` and the legacy `dailyData/{date}` (with a simpler `lifestyleScore`), plus mirrors aggregate `lifeZones` onto `users/{uid}`. Health thus has a dual logging path.

## Insights are health-only
`insightsEngine.js` generates daily/weekly/monthly insight text almost entirely from Health metrics; Wealth/Faith/Family/Community data updates scores/avatar but is largely ignored in generated copy.

## Baseline lock
Onboarding calls `initializeCurrentMeBaseline` (avatarStateManager) → `isLocked:true`; Current Me is baseline-driven and only changes via a Reassessment flow (`unlockBaseline('reassessment')`) or a slow-drift mechanism (max ~0.5 pts after 30+ consistent days). Daily logs are routed to Future Me only via `avatarInputInterceptor`.

## Firestore layout
`users/{uid}` (profile, onboardingBaseline, lifeZones), `users/{uid}/dailyData/{YYYY-MM-DD}`, `users/{uid}/history/{YYYY-MM-DD}` (read as 30-day window), `users/{uid}/zoneLogs/{zoneId}/daily/{YYYY-MM-DD}`, `users/{uid}/monthlySnapshots/{YYYY-MM}` (needs >=7 logs). Missing days are not gap-filled; averages use available points.
