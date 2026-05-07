/**
 * future-me API server
 *
 * Runs alongside Vite dev server. Vite proxies /api/* here.
 * REPLICATE_API_TOKEN is read from process.env — never sent to the client.
 *
 * Routes:
 *   GET  /api/health              — liveness check
 *   POST /api/render/generate     — generate a Future Me image via Replicate
 */

import express  from 'express';
import cors     from 'cors';
import { buildPrompt }    from './promptBuilder.js';
import { generateImage, MODEL_ID } from './replicateService.js';

const app  = express();
const PORT = 3001;

// ─── Rate limiter (in-memory, resets on server restart) ───────────────────────
// Sufficient for controlled testing. Swap for Redis / Firestore in production.
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

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({ origin: true }));
app.use(express.json({ limit: '512kb' }));

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    status:    'ok',
    service:   'future-me-api',
    model:     MODEL_ID,
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
  } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required' });
  }

  // ── Rate limit check ────────────────────────────────────────────────────
  const rate = checkRate(userId);
  if (!rate.allowed) {
    console.log(`[render] Rate limit hit for user ${userId.slice(0, 8)}...`);
    return res.status(429).json({
      error:     `Daily limit of ${MAX_PER_DAY} generations reached. Resets at midnight UTC.`,
      remaining: 0,
    });
  }

  // ── Build prompt ────────────────────────────────────────────────────────
  let prompt, negativePrompt;
  try {
    ({ prompt, negativePrompt } = buildPrompt({
      iteSummary,
      transformationDirection,
      rawMetrics,
      gender,
    }));
  } catch (err) {
    decrementRate(userId);
    console.error('[render] Prompt build error:', err.message);
    return res.status(400).json({ error: 'Failed to build prompt from trajectory data.' });
  }

  console.log(`[render] Generating for ${userId.slice(0, 8)}... | remaining today: ${rate.remaining}`);
  console.log(`[render] Prompt (120 chars): ${prompt.slice(0, 120)}…`);

  // ── Call Replicate ──────────────────────────────────────────────────────
  try {
    const { imageUrl } = await generateImage({ prompt, negativePrompt });

    console.log(`[render] Success for ${userId.slice(0, 8)}... → ${imageUrl.slice(0, 60)}…`);
    return res.json({ imageUrl, remaining: rate.remaining });

  } catch (err) {
    // Refund the rate limit token on failure
    decrementRate(userId);

    console.error(`[render] Replicate error for ${userId.slice(0, 8)}...:`, err.message);

    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Image generation timed out. Please try again.' });
    }

    return res.status(500).json({ error: 'Image generation failed. Please try again.' });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[future-me-api] Listening on port ${PORT}  model=${MODEL_ID}`);
});
