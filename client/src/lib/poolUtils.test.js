import { describe, it, expect } from 'vitest';
import { baseDomain, getPoolInfo, POOLS } from './poolUtils.js';

describe('POOLS', () => {
  it('has identifier, domains, name, and webUrl for each entry', () => {
    POOLS.forEach((pool) => {
      expect(pool).toHaveProperty('identifier');
      expect(pool).toHaveProperty('domains');
      expect(pool).toHaveProperty('name');
      expect(pool).toHaveProperty('webUrl');
      expect(Array.isArray(pool.domains)).toBe(true);
      expect(pool.domains.length).toBeGreaterThan(0);
    });
  });
});

describe('baseDomain', () => {
  it('returns null for null or undefined', () => {
    expect(baseDomain(null)).toBe(null);
    expect(baseDomain(undefined)).toBe(null);
  });

  it('strips stratum+tcp:// and stratum2+tcp://', () => {
    expect(baseDomain('stratum+tcp://btc.viabtc.io')).toBe('viabtc.io');
    expect(baseDomain('stratum2+tcp://eu.ckpool.org')).toBe('ckpool.org');
  });

  it('strips known subdomain prefixes (btc, solo, eu, us, etc.)', () => {
    expect(baseDomain('btc.viabtc.io')).toBe('viabtc.io');
    expect(baseDomain('solo.ckpool.org')).toBe('ckpool.org');
    expect(baseDomain('stratum+tcp://pool.bitcoin.com')).toBe('pool.bitcoin.com');
  });
});

describe('getPoolInfo', () => {
  it('returns placeholder when stratumHost is null or undefined', () => {
    expect(getPoolInfo(null)).toEqual({ name: '--', webUrl: null, identifier: null });
    expect(getPoolInfo(undefined)).toEqual({ name: '--', webUrl: null, identifier: null });
  });

  it('returns known pool name, webUrl, and identifier for ViaBTC stratum URL', () => {
    const info = getPoolInfo('stratum+tcp://btc.viabtc.io');
    expect(info.name).toBe('ViaBTC');
    expect(info.webUrl).toBe('https://www.viabtc.com');
    expect(info.identifier).toBe('viabtc');
  });

  it('returns known pool for Bitcoin.com (pool.bitcoin.com and bitcoin.com)', () => {
    expect(getPoolInfo('stratum+tcp://pool.bitcoin.com')).toEqual({
      name: 'Bitcoin.com',
      webUrl: 'https://www.bitcoin.com',
      identifier: 'bitcoin-com',
    });
    expect(getPoolInfo('stratum+tcp://btc.bitcoin.com')).toEqual({
      name: 'Bitcoin.com',
      webUrl: 'https://www.bitcoin.com',
      identifier: 'bitcoin-com',
    });
  });

  it('returns fallback name and null webUrl/identifier for unknown domain', () => {
    const info = getPoolInfo('stratum+tcp://unknown.pool.example.com');
    expect(info.name).toBe('Example');
    expect(info.webUrl).toBe(null);
    expect(info.identifier).toBe(null);
  });
});
