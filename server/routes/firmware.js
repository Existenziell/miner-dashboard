import crypto from 'crypto';
import { Router } from 'express';

/**
 * GET /api/firmware/releases
 * Fetches GitHub releases for the firmware repo. Query: includePrereleases=true|false.
 * Returns normalized list with tag_name, published_at, assets (name, browser_download_url, checksumUrl if available), html_url, prerelease.
 */
const GITHUB_REPO = 'shufps/ESP-Miner-NerdQAxePlus';
const GITHUB_API_BASE = 'https://api.github.com';

function getGitHubHeaders() {
  const headers = { Accept: 'application/vnd.github+json' };
  const token = process.env.MINER_DASHBOARD_FIRMWARE?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function parseChecksumFromAsset(assetName, allAssets) {
  const base = assetName.replace(/\.(bin|sha256|sha256sum)$/i, '');
  const candidates = [
    `${base}.sha256`,
    `${assetName}.sha256`,
    `${base}.bin.sha256`,
    `${base}.sha256sum`,
  ];
  for (const candidate of candidates) {
    const found = allAssets.find((a) => a.name === candidate || a.name?.toLowerCase() === candidate.toLowerCase());
    if (found) return found.browser_download_url;
  }
  return null;
}

async function fetchReleases(includePrereleases) {
  const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/releases?per_page=30`;
  const res = await fetch(url, {
    headers: getGitHubHeaders(),
  });
  if (!res.ok) {
    const msg = res.status === 403
      ? 'GitHub API rate limit (403). Set MINER_DASHBOARD_FIRMWARE in .env for a higher limit.'
      : `GitHub API error: ${res.status}`;
    throw new Error(msg);
  }
  const data = await res.json();
  const list = Array.isArray(data) ? data : [];
  const filtered = includePrereleases ? list : list.filter((r) => !r.prerelease);
  return filtered.map((r) => {
    const assets = (r.assets || []).map((a) => {
      const checksumUrl = parseChecksumFromAsset(a.name, r.assets || []);
      return {
        name: a.name,
        browser_download_url: a.browser_download_url,
        size: a.size,
        checksumUrl: checksumUrl || undefined,
      };
    });
    return {
      tag_name: r.tag_name,
      name: r.name,
      published_at: r.published_at,
      html_url: r.html_url,
      body: r.body || null,
      prerelease: !!r.prerelease,
      assets,
    };
  });
}

const router = Router();

router.get('/releases', async (req, res) => {
  try {
    const includePrereleases = req.query.includePrereleases === 'true';
    const releases = await fetchReleases(includePrereleases);
    res.json(releases);
  } catch (err) {
    console.error('Firmware releases fetch failed:', err.message);
    const status = err.message.includes('403') ? 429 : 502;
    res.status(status).json({ error: 'Failed to fetch releases', detail: err.message });
  }
});

/** Parse SHA256 from a checksum file (first token or line). */
function parseSha256FromChecksumContent(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const match = trimmed.match(/^([a-fA-F0-9]{64})\s/);
  if (match) return match[1].toLowerCase();
  if (/^[a-fA-F0-9]{64}$/.test(trimmed)) return trimmed.toLowerCase();
  return null;
}

/**
 * POST /api/firmware/download
 * Downloads firmware from URL, verifies SHA256 if expectedSha256 provided, returns binary.
 * Response: body = raw firmware, headers: X-Computed-Sha256, X-Expected-Sha256 (if any), X-Checksum-Verified (true|false).
 * On checksum mismatch: 400 JSON with checksumVerified, computedSha256, expectedSha256.
 */
router.post('/download', async (req, res) => {
  const { url, expectedSha256: expectedFromBody } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url', detail: 'Body must include url (firmware download URL).' });
  }
  try {
    const firmwareRes = await fetch(url);
    if (!firmwareRes.ok) {
      return res.status(502).json({ error: 'Firmware download failed', detail: `HTTP ${firmwareRes.status}` });
    }
    const buffer = Buffer.from(await firmwareRes.arrayBuffer());
    const computedSha256 = crypto.createHash('sha256').update(buffer).digest('hex').toLowerCase();

    let expected = expectedFromBody && String(expectedFromBody).trim().toLowerCase();
    if (!expected) {
      const checksumUrl = url.endsWith('.sha256') ? null : `${url}.sha256`;
      if (checksumUrl) {
        const csRes = await fetch(checksumUrl);
        if (csRes.ok) {
          const text = await csRes.text();
          expected = parseSha256FromChecksumContent(text);
        }
      }
    }
    if (expected && computedSha256 !== expected) {
      return res.status(400).json({
        error: 'Checksum mismatch',
        detail: 'Firmware file does not match the expected SHA256. Download may be corrupted or tampered.',
        checksumVerified: false,
        computedSha256,
        expectedSha256: expected,
      });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('X-Computed-Sha256', computedSha256);
    if (expected) res.setHeader('X-Expected-Sha256', expected);
    res.setHeader('X-Checksum-Verified', expected ? 'true' : 'false');
    res.send(buffer);
  } catch (err) {
    console.error('Firmware download failed:', err.message);
    res.status(502).json({ error: 'Download failed', detail: err.message });
  }
});

export default router;
