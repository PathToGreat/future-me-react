/**
 * replicateService.js
 *
 * Server-side only. Calls the Replicate API to generate a full-body future-self image.
 * REPLICATE_API_TOKEN is read from process.env — never exposed to the client.
 *
 * Model: black-forest-labs/flux-1.1-pro
 * Swappable: replace MODEL_ID and adjust input schema to change providers.
 */

import Replicate from 'replicate';

const MODEL_ID    = 'black-forest-labs/flux-1.1-pro';
const TIMEOUT_MS  = 90_000; // 90 s — Flux 1.1 Pro typically completes in 15–40 s

export async function generateImage({ prompt, negativePrompt }) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('REPLICATE_API_TOKEN not configured on server');

  const replicate = new Replicate({ auth: token });

  // AbortController for timeout
  const controller  = new AbortController();
  const timeoutId   = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const output = await replicate.run(MODEL_ID, {
      input: {
        prompt,
        aspect_ratio:       '2:3',   // portrait — shows full body well
        output_format:      'webp',
        output_quality:     80,
        safety_tolerance:   2,
        prompt_upsampling:  true,
      },
    });

    // Replicate SDK ≥ 1.x returns FileOutput objects; older versions return strings.
    // String() works for both: FileOutput.toString() returns the URL.
    const imageUrl = Array.isArray(output)
      ? String(output[0])
      : String(output);

    if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null') {
      throw new Error('Replicate returned no image URL');
    }

    return { imageUrl };
  } finally {
    clearTimeout(timeoutId);
  }
}

export { MODEL_ID };
