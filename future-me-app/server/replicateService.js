/**
 * replicateService.js
 *
 * Server-side only. Calls the Replicate API to generate a full-body future-self image.
 * REPLICATE_API_TOKEN is read from process.env — never exposed to the client.
 *
 * Provider/model abstraction:
 *   Each entry in MODELS declares its capabilities and how to build its input.
 *   Render modes: text_only | image_reference | image_to_image | identity_preserving
 *
 *   - flux-1.1-pro   : text-to-image. Accepts an optional image_prompt (Flux Redux)
 *                      which guides composition/appearance but does NOT preserve identity.
 *   - flux-kontext-pro: instruction-based image editing. Requires input_image and
 *                      preserves the subject's identity. Candidate for identity-preserving
 *                      renders — selectable via FUTURE_LAB_MODEL env var.
 *
 * Switch models by setting FUTURE_LAB_MODEL=flux-kontext-pro (no code changes needed).
 */

import Replicate from 'replicate';

const TIMEOUT_MS = 90_000;

const MODELS = {
  'flux-1.1-pro': {
    id:                     'black-forest-labs/flux-1.1-pro',
    provider:               'replicate',
    promptStyle:            'generation',      // full text-to-image scene description
    supportsReferenceImage: true,              // via image_prompt (Flux Redux)
    requiresReferenceImage: false,
    identityPreserving:     false,
    modeWithImage:          'image_reference',
    modeWithoutImage:       'text_only',
    buildInput({ prompt, referenceImageUrl }) {
      const input = {
        prompt,
        aspect_ratio:      '2:3',
        output_format:     'webp',
        output_quality:    80,
        safety_tolerance:  2,
        prompt_upsampling: true,
      };
      if (referenceImageUrl) input.image_prompt = referenceImageUrl;
      return input;
    },
  },

  'flux-kontext-pro': {
    id:                     'black-forest-labs/flux-kontext-pro',
    provider:               'replicate',
    promptStyle:            'instruction',     // edit instruction applied to input_image
    supportsReferenceImage: true,              // via input_image
    requiresReferenceImage: true,
    identityPreserving:     true,
    modeWithImage:          'identity_preserving',
    modeWithoutImage:       null,              // cannot run without an input image
    buildInput({ prompt, referenceImageUrl }) {
      return {
        prompt,
        input_image:       referenceImageUrl,
        aspect_ratio:      'match_input_image',
        output_format:     'jpg',   // kontext only supports jpg | png
        safety_tolerance:  2,
        prompt_upsampling: false,
      };
    },
  },
};

const DEFAULT_MODEL_KEY = 'flux-1.1-pro';

export function getActiveModel() {
  const key = process.env.FUTURE_LAB_MODEL || DEFAULT_MODEL_KEY;
  return { key: MODELS[key] ? key : DEFAULT_MODEL_KEY, ...(MODELS[key] || MODELS[DEFAULT_MODEL_KEY]) };
}

/**
 * Generate an image with the active model.
 * Falls back to the default text-capable model when the active model requires
 * a reference image but none is available.
 *
 * Returns: { imageUrl, provider, model, modelKey, renderMode, referenceImagePassedToProvider }
 */
export async function generateImage({ prompt, fallbackPrompt, referenceImageUrl }) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('REPLICATE_API_TOKEN not configured on server');

  let model     = getActiveModel();
  let usePrompt = prompt;

  // Graceful fallback: active model needs an image but we don't have one
  if (model.requiresReferenceImage && !referenceImageUrl) {
    model = { key: DEFAULT_MODEL_KEY, ...MODELS[DEFAULT_MODEL_KEY] };
    if (fallbackPrompt) usePrompt = fallbackPrompt;
  }

  const passImage  = Boolean(referenceImageUrl && model.supportsReferenceImage);
  const renderMode = passImage ? model.modeWithImage : model.modeWithoutImage;

  const replicate  = new Replicate({ auth: token });
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const output = await replicate.run(
      model.id,
      {
        input: model.buildInput({
          prompt:            usePrompt,
          referenceImageUrl: passImage ? referenceImageUrl : undefined,
        }),
        signal: controller.signal, // enforce the 90s timeout
      }
    );

    const imageUrl = Array.isArray(output) ? String(output[0]) : String(output);

    if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null') {
      throw new Error('Replicate returned no image URL');
    }

    return {
      imageUrl,
      provider:                       model.provider,
      model:                          model.id,
      modelKey:                       model.key,
      renderMode,
      referenceImagePassedToProvider: passImage,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const MODEL_ID = MODELS[DEFAULT_MODEL_KEY].id;
