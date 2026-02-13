import { SOLO_POOLS, DEFAULT_STRATUM_PORT } from './constants.js';

/**
 * Build stratum payload for miner PATCH from a solo pool option.
 * @param {SoloPool} option
 * @returns {{ stratumURL: string, stratumPort: number, stratumTLS: boolean }}
 */
export function getStratumPayloadFromOption(option) {
  return {
    stratumURL: option.stratumHost,
    stratumPort: option.port,
    stratumTLS: option.tls,
  };
}

/**
 * Find a SOLO_POOLS entry that matches the current miner stratum host/port.
 * @param {string | null | undefined} stratumURL
 * @param {number | null | undefined} stratumPort
 * @returns {SoloPool | null}
 */
export function findSoloPoolOption(stratumURL, stratumPort) {
  if (!stratumURL) return null;
  const rawHost = stratumURL.replace(/^stratum\+tcp:\/\//, '').replace(/^stratum2\+tcp:\/\//, '').split(':')[0];
  const base = baseDomain(stratumURL) || rawHost;
  const port = stratumPort ?? DEFAULT_STRATUM_PORT;
  // Prefer exact host match so eusolo.ckpool.org matches CKPool (EU), not CKPool
  const exact = SOLO_POOLS.find(
    (opt) => opt.stratumHost === rawHost && opt.port === port
  );
  if (exact) return exact;
  return SOLO_POOLS.find(
    (opt) => baseDomain(opt.stratumHost) === base && opt.port === port
  ) ?? null;
}

/** Extract the base domain from a stratum URL, stripping common prefixes. */
export function baseDomain(stratumHost) {
  if (!stratumHost) return null;
  return stratumHost
    .replace(/^stratum\+tcp:\/\//, '')
    .replace(/^stratum2\+tcp:\/\//, '')
    .replace(/^(btc|stratum|solo|eu|us|eusolo|na|asia|ausolo|pool|mine)\./i, '');
}

function fallbackName(base) {
  const parts = base.split('.');
  const segment = parts.length >= 2 ? parts[parts.length - 2] : base;
  return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : base;
}

/**
 * Resolve pool info from a stratum host URL.
 * @param {string | null | undefined} stratumHost
 * @returns {{ name: string, webUrl: string | null, identifier: string | null }}
 */
export function getPoolInfo(stratumHost) {
  if (!stratumHost) return { name: '--', webUrl: null, identifier: null };
  const rawHost = String(stratumHost)
    .replace(/^stratum\+tcp:\/\//, '')
    .replace(/^stratum2\+tcp:\/\//, '')
    .split(':')[0]
    .trim();
  if (!rawHost) return { name: '--', webUrl: null, identifier: null };

  const exact = SOLO_POOLS.find((p) => p.stratumHost === rawHost);
  if (exact) return { name: exact.name, webUrl: exact.webUrl, identifier: exact.identifier };

  const base = baseDomain(rawHost);
  const pool = SOLO_POOLS.find((p) => baseDomain(p.stratumHost) === base);
  if (pool) return { name: pool.name, webUrl: pool.webUrl, identifier: pool.identifier };

  return { name: fallbackName(base), webUrl: null, identifier: null };
}
