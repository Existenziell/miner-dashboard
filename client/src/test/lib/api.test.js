import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchDashboardConfig,
  downloadFirmwareFromUrl,
  fetchFirmwareChecksum,
  fetchFirmwareReleases,
  flashFirmwareFile,
  installFirmwareFromUrl,
  fetchMinerAsic,
  fetchMinerInfo,
  fetchNetworkStatus,
  patchDashboardConfig,
  patchMinerSettings,
  restartMiner,
  shutdownMiner,
  uploadMinerImage,
} from '@/lib/api.js';

describe('api', () => {
  let fetchStub;
  let hadWindow = false;

  beforeEach(() => {
    fetchStub = vi.fn();
    vi.stubGlobal('fetch', fetchStub);
    if (typeof globalThis.window === 'undefined') {
      hadWindow = false;
      globalThis.window = { location: { origin: 'http://localhost:8000' } };
    } else {
      hadWindow = true;
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (!hadWindow && globalThis.window) delete globalThis.window;
  });

  describe('fetchMinerInfo', () => {
    it('calls /api/miner/info and returns JSON on success', async () => {
      const data = { hashRate: 6000 };
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) });

      const result = await fetchMinerInfo();
      expect(result).toEqual(data);
      expect(fetchStub).toHaveBeenCalledWith('/api/miner/info');
    });

    it('appends ts and cur query params when provided', async () => {
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      await fetchMinerInfo({ ts: 12345, cur: 67890 });
      expect(fetchStub).toHaveBeenCalledWith(expect.stringContaining('ts=12345'));
      expect(fetchStub).toHaveBeenCalledWith(expect.stringContaining('cur=67890'));
    });

    it('throws with message including status when not ok', async () => {
      fetchStub.mockResolvedValueOnce({ ok: false, status: 502 });
      await expect(fetchMinerInfo()).rejects.toThrow('Miner API error: 502');
    });
  });

  describe('fetchMinerAsic', () => {
    it('calls /api/miner/asic and returns JSON on success', async () => {
      const data = { frequency: 700 };
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) });
      const result = await fetchMinerAsic();
      expect(result).toEqual(data);
      expect(fetchStub).toHaveBeenCalledWith('/api/miner/asic');
    });

    it('throws when not ok', async () => {
      fetchStub.mockResolvedValueOnce({ ok: false, status: 502 });
      await expect(fetchMinerAsic()).rejects.toThrow('Miner ASIC API error: 502');
    });
  });

  describe('fetchNetworkStatus', () => {
    it('calls /api/network/status and returns JSON on success', async () => {
      const data = { blockHeight: 900000 };
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) });
      const result = await fetchNetworkStatus();
      expect(result).toEqual(data);
      expect(fetchStub).toHaveBeenCalledWith('/api/network/status');
    });

    it('returns mempool, previousBlock, previousBlock2, previousBlock3 when present', async () => {
      const data = {
        blockHeight: 900000,
        difficulty: {},
        fees: {},
        prices: { USD: 50000 },
        networkDifficulty: 1e12,
        mempool: { count: 15000, vsize: 4000000, total_fee: 900000 },
        previousBlock: {
          id: '0000000000000000000123abc',
          height: 900000,
          timestamp: 1700000000,
          tx_count: 2500,
          size: 1500000,
          weight: 4000000,
          extras: { pool: { name: 'Foundry USA' }, reward: 625000000 },
        },
        previousBlock2: {
          id: '0000000000000000000456def',
          height: 899999,
          timestamp: 1699999500,
          tx_count: 2100,
          size: 1400000,
          weight: 3990000,
        },
        previousBlock3: {
          id: '0000000000000000000789abc',
          height: 899998,
          timestamp: 1699999000,
          tx_count: 2000,
          size: 1300000,
          weight: 3980000,
        },
      };
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) });
      const result = await fetchNetworkStatus();
      expect(result.mempool).toEqual(data.mempool);
      expect(result.previousBlock).toEqual(data.previousBlock);
      expect(result.previousBlock2).toEqual(data.previousBlock2);
      expect(result.previousBlock3).toEqual(data.previousBlock3);
    });

    it('throws when not ok', async () => {
      fetchStub.mockResolvedValueOnce({ ok: false, status: 502 });
      await expect(fetchNetworkStatus()).rejects.toThrow('Network API error: 502');
    });
  });

  describe('patchMinerSettings', () => {
    it('PATCHes /api/miner/settings with JSON body and returns JSON', async () => {
      const settings = { frequency: 720 };
      const response = { success: true };
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(response) });

      const result = await patchMinerSettings(settings);
      expect(result).toEqual(response);
      expect(fetchStub).toHaveBeenCalledWith('/api/miner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency: 720 }),
      });
    });

    it('throws before sending when payload fails schema validation', async () => {
      await expect(patchMinerSettings({ autofanspeed: 3 })).rejects.toThrow('Validation failed:');
      expect(fetchStub).not.toHaveBeenCalled();
    });

    it('throws when not ok', async () => {
      fetchStub.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(patchMinerSettings({})).rejects.toThrow('Miner PATCH error: 400');
    });

    it('sends WiFi settings (hostname, ssid, wifiPass) when provided', async () => {
      const settings = { hostname: 'bitaxe', ssid: 'MyNetwork', wifiPass: 'secret123' };
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) });

      await patchMinerSettings(settings);
      expect(fetchStub).toHaveBeenCalledWith('/api/miner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname: 'bitaxe', ssid: 'MyNetwork', wifiPass: 'secret123' }),
      });
    });
  });

  describe('restartMiner', () => {
    it('POSTs /api/miner/restart and returns JSON', async () => {
      const response = { success: true, message: 'Miner restarting...' };
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(response) });
      const result = await restartMiner();
      expect(result).toEqual(response);
      expect(fetchStub).toHaveBeenCalledWith('/api/miner/restart', { method: 'POST' });
    });

    it('throws when not ok', async () => {
      fetchStub.mockResolvedValueOnce({ ok: false, status: 502 });
      await expect(restartMiner()).rejects.toThrow('Miner restart error: 502');
    });
  });

  describe('shutdownMiner', () => {
    it('POSTs /api/miner/shutdown and returns JSON', async () => {
      const response = { success: true, message: 'Miner shutting down...' };
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(response) });
      const result = await shutdownMiner();
      expect(result).toEqual(response);
      expect(fetchStub).toHaveBeenCalledWith('/api/miner/shutdown', { method: 'POST' });
    });

    it('throws when not ok', async () => {
      fetchStub.mockResolvedValueOnce({ ok: false, status: 502 });
      await expect(shutdownMiner()).rejects.toThrow('Miner shutdown error: 502');
    });
  });

  describe('fetchFirmwareReleases', () => {
    it('GETs /api/firmware/releases and returns JSON', async () => {
      const data = [{ tag_name: 'v1.0.36', assets: [] }];
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) });
      const result = await fetchFirmwareReleases();
      expect(result).toEqual(data);
      expect(fetchStub).toHaveBeenCalledWith(expect.stringContaining('/api/firmware/releases'));
      expect(fetchStub).toHaveBeenCalledWith(expect.stringContaining('includePrereleases=false'));
    });

    it('passes includePrereleases=true when requested', async () => {
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
      await fetchFirmwareReleases({ includePrereleases: true });
      expect(fetchStub).toHaveBeenCalledWith(expect.stringContaining('includePrereleases=true'));
    });

    it('throws with message when not ok', async () => {
      fetchStub.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Failed to fetch releases', detail: 'Rate limited.' }),
      });
      await expect(fetchFirmwareReleases()).rejects.toThrow(/Releases error: 429/);
    });
  });

  describe('fetchFirmwareChecksum', () => {
    it('returns null when checksumUrl is empty', async () => {
      expect(await fetchFirmwareChecksum(null)).toBeNull();
      expect(await fetchFirmwareChecksum('')).toBeNull();
      expect(fetchStub).not.toHaveBeenCalled();
    });

    it('fetches checksum URL and parses SHA256', async () => {
      const hash = `${'a'.repeat(64)  }\n`;
      fetchStub.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(hash) });
      const result = await fetchFirmwareChecksum('https://example.com/file.sha256');
      expect(result).toBe('a'.repeat(64));
      expect(fetchStub).toHaveBeenCalledWith('https://example.com/file.sha256');
    });

    it('returns null when response not ok', async () => {
      fetchStub.mockResolvedValueOnce({ ok: false });
      expect(await fetchFirmwareChecksum('https://example.com/file.sha256')).toBeNull();
    });
  });

  describe('downloadFirmwareFromUrl', () => {
    it('POSTs /api/firmware/download and returns blob with verification headers', async () => {
      const blob = new Blob(['firmware-binary']);
      const res = {
        ok: true,
        blob: () => Promise.resolve(blob),
        headers: { get: (name) => ({ 'X-Computed-Sha256': 'abc', 'X-Expected-Sha256': 'abc', 'X-Checksum-Verified': 'true' }[name]) },
      };
      fetchStub.mockResolvedValueOnce(res);
      const result = await downloadFirmwareFromUrl({ url: 'https://example.com/fw.bin', expectedSha256: 'abc' });
      expect(result.blob).toBe(blob);
      expect(result.computedSha256).toBe('abc');
      expect(result.expectedSha256).toBe('abc');
      expect(result.checksumVerified).toBe(true);
      expect(fetchStub).toHaveBeenCalledWith('/api/firmware/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/fw.bin', expectedSha256: 'abc' }),
      });
    });

    it('throws and attaches installErrorBody when response has checksum fields (400)', async () => {
      const body = { error: 'Checksum mismatch', checksumVerified: false, computedSha256: 'aaa', expectedSha256: 'bbb' };
      fetchStub.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve(body) });
      const err = await downloadFirmwareFromUrl({ url: 'https://x/fw.bin' }).catch((e) => e);
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toContain('Checksum mismatch');
      expect(err.installErrorBody).toEqual(body);
    });
  });

  describe('installFirmwareFromUrl', () => {
    it('POSTs /api/miner/firmware/install with url and optional expectedSha256', async () => {
      const response = { success: true, message: 'Firmware install started.', checksumVerified: true };
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(response) });
      const result = await installFirmwareFromUrl({ url: 'https://example.com/fw.bin', expectedSha256: 'abc123' });
      expect(result).toEqual(response);
      expect(fetchStub).toHaveBeenCalledWith('/api/miner/firmware/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/fw.bin', keepSettings: false, expectedSha256: 'abc123' }),
      });
    });

    it('throws and attaches installErrorBody when response has checksum fields', async () => {
      const body = { error: 'Checksum mismatch', checksumVerified: false, computedSha256: 'aaa', expectedSha256: 'bbb' };
      fetchStub.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve(body) });
      const err = await installFirmwareFromUrl({ url: 'https://x/fw.bin' }).catch((e) => e);
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toContain('Checksum mismatch');
      expect(err.installErrorBody).toEqual(body);
    });
  });

  describe('flashFirmwareFile', () => {
    it('POSTs /api/miner/firmware/flash with FormData and type param', async () => {
      const file = new Blob(['binary'], { type: 'application/octet-stream' });
      const response = { success: true, message: 'Firmware flash started.' };
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(response) });
      const result = await flashFirmwareFile(file, 'firmware');
      expect(result).toEqual(response);
      expect(fetchStub).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/miner\/firmware\/flash\?type=firmware/),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('uses type=www when specified', async () => {
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) });
      await flashFirmwareFile(new Blob(), 'www');
      expect(fetchStub).toHaveBeenCalledWith(expect.stringContaining('type=www'), expect.any(Object));
    });

    it('throws when not ok', async () => {
      fetchStub.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ detail: 'Miner unreachable' }),
      });
      await expect(flashFirmwareFile(new Blob(), 'firmware')).rejects.toThrow('Miner unreachable');
    });
  });

  describe('fetchDashboardConfig', () => {
    it('GETs /api/config and returns JSON', async () => {
      const data = { minerIp: '', defaultExpectedHashrateGh: 6000, pollMinerIntervalMs: 10000, metricRanges: {} };
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) });
      const result = await fetchDashboardConfig();
      expect(result).toEqual(data);
      expect(fetchStub).toHaveBeenCalledWith('/api/config');
    });

    it('throws with message when not ok', async () => {
      fetchStub.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(fetchDashboardConfig()).rejects.toThrow('Config API error: 500');
    });
  });

  describe('patchDashboardConfig', () => {
    it('PATCHes /api/config with JSON body and returns updated config', async () => {
      const payload = { minerIp: '192.168.1.3', defaultExpectedHashrateGh: 6500 };
      const response = { ...payload, pollMinerIntervalMs: 10000, metricRanges: {} };
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(response) });
      const result = await patchDashboardConfig(payload);
      expect(result).toEqual(response);
      expect(fetchStub).toHaveBeenCalledWith('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    });

    it('throws when not ok and parses error body', async () => {
      fetchStub.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Validation failed', details: ['minerIp must be a string'] }),
      });
      await expect(patchDashboardConfig({ minerIp: 123 })).rejects.toThrow(/Config PATCH error: 400.*Validation failed/);
    });

    it('sends metricRanges when provided', async () => {
      const payload = { metricRanges: { hashrate: { min: 5500, gaugeMax: 7000 } } };
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(payload) });
      await patchDashboardConfig(payload);
      expect(fetchStub).toHaveBeenCalledWith('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    });
  });

  describe('uploadMinerImage', () => {
    it('POSTs /api/config/miner-image with FormData and returns config', async () => {
      const file = new Blob(['image'], { type: 'image/jpeg' });
      const response = { minerImageFile: 'miner-image.jpg', minerImageFilename: 'photo.jpg' };
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(response) });
      const result = await uploadMinerImage(file, 'photo.jpg');
      expect(result).toEqual(response);
      expect(fetchStub).toHaveBeenCalledWith(
        '/api/config/miner-image',
        expect.objectContaining({ method: 'POST' })
      );
      const call = fetchStub.mock.calls[0][1];
      expect(call.body).toBeInstanceOf(FormData);
    });

    it('throws when not ok and parses error body', async () => {
      fetchStub.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid file', detail: 'File must be an image.' }),
      });
      await expect(uploadMinerImage(new Blob(), 'x')).rejects.toThrow(/Miner image upload failed.*File must be an image/);
    });
  });
});
