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

export default router;
