import { Router } from 'express';

const router = Router();

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

// Build block payload for API (id, height, timestamp, tx_count, size, weight, previousblockhash, difficulty, extras)
function blockPayload(b) {
  if (!b) return null;
  const { id, height, timestamp, tx_count, size, weight, previousblockhash, difficulty, extras } = b;
  const payload = {
    id,
    height,
    timestamp,
    tx_count,
    size,
    weight,
    previousblockhash,
    difficulty,
  };
  if (extras) payload.extras = extras;
  return payload;
}

// GET /api/network/status - aggregated Bitcoin network data
router.get('/status', async (_req, res) => {
  try {
    const api = 'https://mempool.space/api';

    const [blockHeight, difficulty, fees, prices, blocks, mempool] = await Promise.all([
      cachedFetch(`${api}/blocks/tip/height`),
      cachedFetch(`${api}/v1/difficulty-adjustment`),
      cachedFetch(`${api}/v1/fees/recommended`),
      cachedFetch(`${api}/v1/prices`),
      cachedFetch(`${api}/v1/blocks`),
      cachedFetch(`${api}/mempool`),
    ]);

    const blocksList = Array.isArray(blocks) ? blocks : [];
    const previousBlockRaw = blocksList.length > 0 ? blocksList[0] : null;
    const previousBlock2Raw = blocksList.length > 1 ? blocksList[1] : null;
    const previousBlock3Raw = blocksList.length > 2 ? blocksList[2] : null;
    const networkDifficulty = previousBlockRaw?.difficulty ?? null;

    const mempoolPayload =
      mempool && typeof mempool.count === 'number'
        ? { count: mempool.count, vsize: mempool.vsize ?? null, total_fee: mempool.total_fee ?? null }
        : null;

    res.json({
      blockHeight: typeof blockHeight === 'string' ? parseInt(blockHeight, 10) : blockHeight,
      difficulty,
      fees,
      prices,
      networkDifficulty,
      mempool: mempoolPayload,
      previousBlock: blockPayload(previousBlockRaw),
      previousBlock2: blockPayload(previousBlock2Raw),
      previousBlock3: blockPayload(previousBlock3Raw),
    });
  } catch (err) {
    console.error('Failed to fetch network status:', err.message);
    res.status(502).json({ error: 'Cannot fetch network data', detail: err.message });
  }
});

export default router;
