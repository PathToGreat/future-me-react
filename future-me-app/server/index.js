/**
 * future-me API server
 *
 * Dev:  runs on port 3001 alongside Vite (port 5000). Vite proxies /api/* here.
 * Prod: runs on PORT env var (default 5000), serves built frontend from dist/
 *       AND handles all /api/* routes — no separate Vite proxy needed.
 *
 * Routes:
 *   GET  /api/health              — liveness check
 *   POST /api/render/generate     — generate a Future Me image via Replicate
 */

import path   from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors    from 'cors';
import { buildPrompt, buildEditInstruction } from './promptBuilder.js';
import { generateImage, getActiveModel, MODEL_ID } from './replicateService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const IS_PROD = process.env.NODE_ENV === 'production';
const PORT    = parseInt(process.env.PORT || (IS_PROD ? '5000' : '3001'), 10);

const app = express();

// ─── Rate limiter (in-memory, resets on server restart) ───────────────────────
const MAX_PER_DAY = 3;
const rateMap     = new Map(); // userId → { date: 'YYYY-MM-DD', count: number }

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function checkRate(userId) {
  const today = todayUTC();
  const entry = rateMap.get(userId);

  if (!entry || entry.date !== today) {
    rateMap.set(userId, { date: today, count: 1 });
    return { allowed: true, remaining: MAX_PER_DAY - 1, used: 1 };
  }

  if (entry.count >= MAX_PER_DAY) {
    return { allowed: false, remaining: 0, used: entry.count };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_PER_DAY - entry.count, used: entry.count };
}

function decrementRate(userId) {
  const entry = rateMap.get(userId);
  if (entry) entry.count = Math.max(0, entry.count - 1);
}

// ─── Reference image validation ───────────────────────────────────────────────
// Only https URLs are accepted (Firebase Storage download URLs). Never logged.

function sanitizeReferenceImageUrl(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    return value;
  } catch {
    return null;
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({ origin: true }));
app.use(express.json({ limit: '512kb' }));

// ─── API Routes ───────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  const active = getActiveModel();
  res.json({
    status:    'ok',
    service:   'future-me-api',
    model:     active.id,
    modelKey:  active.key,
    env:       IS_PROD ? 'production' : 'development',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/render/generate', async (req, res) => {
  const {
    userId,
    iteSummary,
    transformationDirection,
    rawMetrics,
    gender,
    referenceImageUrl: rawReferenceImageUrl,
  } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required' });
  }

  const referenceImageUrl     = sanitizeReferenceImageUrl(rawReferenceImageUrl);
  const referenceImagePresent = Boolean(referenceImageUrl);

  const rate = checkRate(userId);
  if (!rate.allowed) {
    console.log(`[render] Rate limit hit for user ${userId.slice(0, 8)}...`);
    return res.status(429).json({
      error:     `Daily limit of ${MAX_PER_DAY} generations reached. Resets at midnight UTC.`,
      remaining: 0,
    });
  }

  // Build both prompt styles; the service picks based on the active model.
  let scenePrompt, editPrompt, trajectoryDirection, strongestTraits, promptVersion;
  try {
    const scene = buildPrompt({ iteSummary, transformationDirection, rawMetrics, gender });
    const edit  = buildEditInstruction({ transformationDirection, rawMetrics, gender });

    scenePrompt         = scene.prompt;
    editPrompt          = edit.prompt;
    trajectoryDirection = scene.trajectoryDirection;
    strongestTraits     = scene.strongestTraits;
    promptVersion       = scene.promptVersion;
  } catch (err) {
    decrementRate(userId);
    console.error('[render] Prompt build error:', err.message);
    return res.status(400).json({ error: 'Failed to build prompt from trajectory data.' });
  }

  const activeModel = getActiveModel();
  const usesEditStyle = activeModel.promptStyle === 'instruction' && referenceImagePresent;
  const prompt = usesEditStyle ? editPrompt : scenePrompt;

  // Safe logging only — never log the reference image URL itself.
  console.log(
    `[render] Generating for ${userId.slice(0, 8)}... | model=${activeModel.key} | ` +
    `direction=${trajectoryDirection} | referenceImagePresent=${referenceImagePresent} | ` +
    `remaining today: ${rate.remaining}`
  );

  try {
    const result = await generateImage({
      prompt,
      fallbackPrompt: scenePrompt, // used if active model requires an image we don't have
      referenceImageUrl,
    });

    console.log(
      `[render] Success for ${userId.slice(0, 8)}... | renderMode=${result.renderMode} | ` +
      `referenceImagePassedToProvider=${result.referenceImagePassedToProvider}`
    );

    return res.json({
      imageUrl:  result.imageUrl,
      remaining: rate.remaining,
      renderMeta: {
        provider:                       result.provider,
        model:                          result.model,
        modelKey:                       result.modelKey,
        promptVersion,
        renderMode:                     result.renderMode,
        referenceImagePresent,
        referenceImagePassedToProvider: result.referenceImagePassedToProvider,
        trajectoryDirection,
        strongestTraits,
      },
    });

  } catch (err) {
    decrementRate(userId);
    console.error(`[render] Replicate error for ${userId.slice(0, 8)}...:`, err.message);

    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Image generation timed out. Please try again.' });
    }
    return res.status(500).json({ error: 'Image generation failed. Please try again.' });
  }
});

// ─── Static frontend (production only) ───────────────────────────────────────
// In dev, Vite serves the frontend on port 5000 and proxies /api/* to this server.
// In production, this server serves the built frontend AND the API from the same port.

if (IS_PROD) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));

  // SPA catch-all — return index.html for any non-API path so React Router works
  // Express 5 requires named wildcard: '/{*path}' instead of bare '*'
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[future-me-api] Listening on port ${PORT}  env=${IS_PROD ? 'production' : 'development'}  model=${getActiveModel().id}`);
});
