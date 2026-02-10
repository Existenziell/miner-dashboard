import { Router } from 'express';

const router = Router();

const MEMPOOL_API = () => process.env.MEMPOOL_API || 'https://mempool.space/api';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL_MS = 30_000; // 30 seconds

async function cachedFetch(url) {
  const now = Date.now();
  const entry = cache.get(url);
  if (entry && now - entry.ts < CACHE_TTL_MS) {
    return entry.data;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  cache.set(url, { data, ts: now });
  return data;
}

// GET /api/network/status - aggregated Bitcoin network data
router.get('/status', async (_req, res) => {
  try {
    const api = MEMPOOL_API();

    const [blockHeight, difficulty, fees, prices, blocks] = await Promise.all([
      cachedFetch(`${api}/blocks/tip/height`),
      cachedFetch(`${api}/v1/difficulty-adjustment`),
      cachedFetch(`${api}/v1/fees/recommended`),
      cachedFetch(`${api}/v1/prices`),
      cachedFetch(`${api}/blocks`),
    ]);

    // Get current network difficulty from the latest block
    const latestBlock = Array.isArray(blocks) && blocks.length > 0 ? blocks[0] : null;
    const networkDifficulty = latestBlock?.difficulty ?? null;

    res.json({
      blockHeight: typeof blockHeight === 'string' ? parseInt(blockHeight, 10) : blockHeight,
      difficulty,
      fees,
      prices,
      networkDifficulty,
    });
  } catch (err) {
    console.error('Failed to fetch network status:', err.message);
    res.status(502).json({ error: 'Cannot fetch network data', detail: err.message });
  }
});

export default router;
