---
name: Daily Quick Log vs Health Zone Detail (data-flow split)
description: Canonical data paths and ITE-extension rules for the "separate daily log from health detail" refactor
---

# Daily Quick Log vs Health Zone Detail

Refactor that split the fast daily "Log Today's Metrics" scan from the deeper periodic Health-zone check-in.

## Canonical data paths (document, don't re-derive)
- **`dailyData/{date}` is canonical for daily whole-person signals** (sleepQuality, sleepDuration, energy, movement, nutrition, stress, mood). It also stores legacy-compatible field names `sleep`(=sleepQuality) and `activity`(=movement) — never drop these; dashboard `TodaysSignals`/`directionHint`, `historyData`, and ITE `rawMetrics` all read `activity/nutrition/sleep/stress`.
- **`zoneLogs/health/daily/{date}` is canonical for the Health zone SCORE.** The Daily Quick Log writes a *compatibility bridge* (the 4 core fields) into this doc (merge) so the Health zone stays live for users who only do the quick log. Health Detail merges deep fields (strength, mobility, hydration, protein, outdoor, recovery, bodyTension) into the SAME doc.
- `profile.lastDailyLog` = superset (compat fields + new signals). `profile.lastHealthDetail` = latest deep check-in (added for ITE plumbing, mirrors lastDailyLog).

## Health zone scoring (lifeZoneEngine.calculateHealthZone)
- Core formula stays on activity/nutrition/sleep/stress. Deep detail blends in at ~20% ONLY when a detail field is present, so old 4-field docs score identically (backward compat).
- **Deep-only-day trap:** a Health-Detail-only day's latest zoneLog lacks the 4 core fields → defaults to all-3s (base 50). Fix = pull core fields from the most recent entry that HAS them, not strictly `zoneHistory[0]`.

## ITE extension rule (why additive boost, not weighted sources)
**Do NOT add new fields as weighted sources in `traitMappingTable`.** Two hard failures:
1. `validateMappingTable` requires each trait's weights to sum to 1.0 → adding a source forces a rebalance that shifts every existing user's trait scores.
2. `buildSourceMapFromEntry` copies today's fallbackSources, so history entries lacking a new field inherit TODAY's value → silently corrupts 7/30-day averages + velocity.
**Instead** mirror the `habitBoost` precedent: a small bounded ADDITIVE boost (clamp ±3/trait) applied to `currentScore` only (never to historical averages), null-safe. New signals (energy, mood, sleepDuration, health-detail fields) live in `computeDailySignalBoosts`. Health-detail also flows to traits via `zone.health` through the score blend.
**Why:** honors spec §6 "extend mappings carefully / don't overpower core metrics" AND the guardrail "don't change the trait-engine architecture."
- Plumb new daily signals + spread `lastHealthDetail` into rawMetrics in AvatarScreen, TodaysReflection, InsightsFeed. **Leave FutureLabScreen rawMetrics untouched** (Future Lab is a guardrail) — boost is naturally 0 there since fields aren't passed.

## LifeZoneDetailsModal blocker
Once health inputs become deep fields, the old `if (zoneId==='health'){ activity=newLog.activity||3 ... lifestyleScore }` block writes 3s + lifestyleScore=50 to the profile root on every detail save, clobbering real daily values the avatar/ITE read. Must remove it (Daily Quick Log now owns those profile fields).
