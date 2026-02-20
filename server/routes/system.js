import { Router } from 'express';
import fs from 'fs/promises';
import os from 'os';

const router = Router();

const MEMINFO_PATH = '/proc/meminfo';

async function readMeminfo() {
  try {
    const buf = await fs.readFile(MEMINFO_PATH, 'utf8');
    const lines = buf.split('\n');
    const get = (key) => {
      const line = lines.find((l) => l.startsWith(key + ':'));
      if (!line) return null;
      const match = line.match(/\d+/);
      return match ? parseInt(match[0], 10) * 1024 : null; // value is in KB
    };
    return {
      memAvailableBytes: get('MemAvailable'),
      swapTotalBytes: get('SwapTotal'),
      swapFreeBytes: get('SwapFree'),
    };
  } catch {
    return { memAvailableBytes: null, swapTotalBytes: null, swapFreeBytes: null };
  }
}

// GET /api/system/status - host system metrics (CPU load, memory, uptime; on Linux: meminfo)
router.get('/status', async (_req, res) => {
  try {
    const totalBytes = os.totalmem();
    const freeBytes = os.freemem();
    const usedBytes = totalBytes - freeBytes;
    const usagePercent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : null;

    const meminfo = await readMeminfo();

    res.json({
      loadAvg: os.loadavg(),
      cpuCount: os.cpus().length,
      totalBytes,
      freeBytes,
      usedBytes,
      usagePercent,
      uptimeSeconds: os.uptime(),
      ...meminfo,
    });
  } catch (err) {
    console.error('Failed to get system status:', err.message);
    res.status(500).json({ error: 'Cannot get system status', detail: err.message });
  }
});

export default router;
