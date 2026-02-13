import { describe, it, expect } from 'vitest';
import { SOLO_POOLS } from '../lib/constants.js';
import { baseDomain, getPoolInfo } from '../lib/poolUtils.js';

describe('SOLO_POOLS', () => {
  it('has identifier, name, stratumHost, port, tls, and webUrl for each entry', () => {
    SOLO_POOLS.forEach((pool) => {
      expect(pool).toHaveProperty('identifier');
      expect(pool).toHaveProperty('name');
      expect(pool).toHaveProperty('stratumHost');
      expect(pool).toHaveProperty('port');
      expect(pool).toHaveProperty('tls');
      expect(pool).toHaveProperty('webUrl');
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

  it('strips known subdomain prefixes (btc, solo, eu, us, mine, etc.)', () => {
    expect(baseDomain('btc.viabtc.io')).toBe('viabtc.io');
    expect(baseDomain('solo.ckpool.org')).toBe('ckpool.org');
    expect(baseDomain('mine.ocean.xyz')).toBe('ocean.xyz');
    expect(baseDomain('stratum.kano.is')).toBe('kano.is');
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

  it('returns known pool for ViaBTC (pool.viabtc.io and btc.viabtc.io)', () => {
    expect(getPoolInfo('stratum+tcp://pool.viabtc.io')).toEqual({
      name: 'ViaBTC',
      webUrl: 'https://www.viabtc.com',
      identifier: 'viabtc',
    });
    expect(getPoolInfo('stratum+tcp://btc.viabtc.io')).toEqual({
      name: 'ViaBTC',
      webUrl: 'https://www.viabtc.com',
      identifier: 'viabtc',
    });
  });

  it('returns known pool for OCEAN (mine.ocean.xyz)', () => {
    expect(getPoolInfo('mine.ocean.xyz')).toEqual({
      name: 'OCEAN',
      webUrl: 'https://ocean.xyz',
      identifier: 'ocean',
    });
    expect(getPoolInfo('stratum+tcp://mine.ocean.xyz:3334')).toEqual({
      name: 'OCEAN',
      webUrl: 'https://ocean.xyz',
      identifier: 'ocean',
    });
  });

  it('returns known pool for Kano (stratum.kano.is)', () => {
    expect(getPoolInfo('stratum.kano.is')).toEqual({
      name: 'Kano',
      webUrl: 'https://kano.is',
      identifier: 'kano',
    });
  });

  it('returns known pool for new pools (Solo-Pool EU, CKPool Oceania, SoloPool.org)', () => {
    expect(getPoolInfo('btc-eu.solo-pool.org')).toEqual({
      name: 'Solo-Pool',
      webUrl: 'https://btc.solo-pool.org/',
      identifier: 'solo-pool-eu',
    });
    expect(getPoolInfo('ausolo.ckpool.org')).toEqual({
      name: 'CKPool (Oceania)',
      webUrl: 'https://ausolo.ckpool.org/',
      identifier: 'ckpool-oceania',
    });
    expect(getPoolInfo('eu3.solopool.org')).toEqual({
      name: 'SoloPool.org',
      webUrl: 'https://btc.solopool.org',
      identifier: 'solopool-org',
    });
  });

  it('returns fallback name and null webUrl/identifier for unknown domain', () => {
    const info = getPoolInfo('stratum+tcp://unknown.pool.example.com');
    expect(info.name).toBe('Example');
    expect(info.webUrl).toBe(null);
    expect(info.identifier).toBe(null);
  });
});
