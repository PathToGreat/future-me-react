---
name: Replicate model capabilities for Future Lab renders
description: Which Replicate models can/can't preserve identity, and account throttle quirk
---

- `flux-1.1-pro`'s `image_prompt` input is Flux Redux **composition/appearance guidance only** — it does NOT preserve identity. Never present its output as likeness-preserving.
- True identity preservation on Replicate: `black-forest-labs/flux-kontext-pro` (`input_image` + edit instruction, `output_format` must be jpg|png, `aspect_ratio: 'match_input_image'`). Wired as env-var swap `FUTURE_LAB_MODEL=flux-kontext-pro`; kontext prompts must be *edit instructions* ("keep the same face…"), not scene descriptions.
- **Why:** User's core complaint was renders looking like "a generic polished person" — the reference image was never sent, and even when sent to flux it can't preserve identity. Honesty microcopy in Future Lab depends on `renderMode` being truthful.
- Account quirk (July 2026): Replicate throttles to 6 predictions/min with burst of 1 while account credit < $5 — back-to-back test generations need ~15s sleep between calls.
