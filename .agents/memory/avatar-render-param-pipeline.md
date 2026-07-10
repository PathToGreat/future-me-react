---
name: Avatar render-param pipeline traps
description: Two non-obvious constraints when adding/changing deterministic SVG avatar render params in Future Me.
---

# Avatar render-param pipeline traps

## 1. New render params get silently dropped unless whitelisted at every chokepoint
Adding a new avatar render param (e.g. an emotional/expression channel) requires registering it in ALL of these, or it vanishes before it reaches the SVG:
- `AVATAR_PARAM_DEFAULTS` and `PARAM_RANGES` in `avatarParams.js` (`normalizeParams` DROPS any key not in `PARAM_RANGES`).
- the `emotionalKeys` list in `applyConfidenceScaling` (`projectionConfidence.js`) if the param should be confidence-scaled.
- the mapping output (`computeEmotionalVisualParams` / `buildBodyParams`) in `mapTraitsToAvatarParams.js`.
- the renderer consumption in `HumanAvatarRenderer.jsx` (destructure with a neutral default).

**Why:** `normalizeParams` is an allowlist clamp — unknown keys are stripped, so a param can be produced upstream and still never render, with no error.
**How to apply:** when touching avatar params, grep the param name across those files and confirm it appears in each; default new params to a neutral value (0.5 for 0..1 channels) so absence = no visual effect.

## 2. Display-only contrast amplification must be opt-in, or it leaks into the Future Lab AI render
Both `AvatarScreen` (side-by-side Current-vs-Future comparison) and `FutureLabScreen` render the same `<FutureAvatar>` component. A visual delta amplifier belongs ONLY in the comparison.

**Why:** the spec forbids changing Future Lab / Replicate output; amplifying render params globally would alter what the AI-render path visualizes.
**How to apply:** gate amplification behind an opt-in prop (`amplifyContrast`, default false) passed only from the comparison call site. Apply the multiplier post-pipeline to a fixed set of visible channels, then re-run `enforceBodyConstraints` + `normalizeParams` so amplified values stay within hard body constraints. ~1.3x is the tuned value (spec band 1.25–1.4).
