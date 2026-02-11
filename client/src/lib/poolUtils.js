/**
 * Single registry of known mining pools: domains (after baseDomain), display name, web URL, and identifier.
 * Stratum hosts (e.g. btc.viabtc.io) often differ from the pool’s real site; we match on base domain.
 */
export const POOLS = [
  { identifier: 'viabtc', domains: ['viabtc.io'], name: 'ViaBTC', webUrl: 'https://www.viabtc.com' },
  { identifier: 'ckpool', domains: ['ckpool.org'], name: 'CKPool', webUrl: 'https://eusolo.ckpool.org/' },
  { identifier: 'bitcoin-com', domains: ['pool.bitcoin.com', 'bitcoin.com'], name: 'Bitcoin.com', webUrl: 'https://www.bitcoin.com' },
  { identifier: 'braiins', domains: ['braiins.com'], name: 'Braiins', webUrl: 'https://braiins.com' },
  { identifier: 'slushpool', domains: ['slushpool.com'], name: 'Braiins (Slush)', webUrl: 'https://slushpool.com' },
  { identifier: 'antpool', domains: ['antpool.com'], name: 'AntPool', webUrl: 'https://www.antpool.com' },
  { identifier: 'f2pool', domains: ['f2pool.com'], name: 'F2Pool', webUrl: 'https://www.f2pool.com' },
  { identifier: 'foundry-usa', domains: ['foundryusapool.com'], name: 'Foundry USA', webUrl: 'https://www.foundrydigital.com' },
  { identifier: 'luxor', domains: ['luxor.tech'], name: 'Luxor', webUrl: 'https://www.luxor.tech' },
  { identifier: 'ocean', domains: ['ocean.xyz'], name: 'OCEAN', webUrl: 'https://ocean.xyz' },
  { identifier: 'kano', domains: ['kano.is'], name: 'Kano', webUrl: 'https://kano.is' },
  { identifier: 'poolin', domains: ['poolin.com'], name: 'Poolin', webUrl: 'https://www.poolin.com' },
  { identifier: 'public-pool', domains: ['public-pool.io'], name: 'Public Pool', webUrl: 'https://web.public-pool.io' },
  { identifier: 'd-central', domains: ['solo.d-central.tech', 'd-central.tech'], name: 'D-Central Solo', webUrl: 'https://d-central.tech' },
];

/** Extract the base domain from a stratum URL, stripping common prefixes. */
export function baseDomain(stratumHost) {
  if (!stratumHost) return null;
  return stratumHost
    .replace(/^stratum\+tcp:\/\//, '')
    .replace(/^stratum2\+tcp:\/\//, '')
    .replace(/^(btc|stratum|solo|eu|us|eusolo|na|asia|ausolo)\./i, '');
}

function fallbackName(base) {
  const parts = base.split('.');
  const segment = parts.length >= 2 ? parts[parts.length - 2] : base;
  return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : base;
}

function matchDomain(base, domain) {
  return base === domain || base.endsWith(`.${domain}`);
}

/**
 * Resolve pool info from a stratum host URL.
 * @param {string | null | undefined} stratumHost
 * @returns {{ name: string, webUrl: string | null, identifier: string | null }}
 */
export function getPoolInfo(stratumHost) {
  const base = baseDomain(stratumHost);
  if (!base) return { name: '--', webUrl: null, identifier: null };

  const pool = POOLS.find((p) => p.domains.some((d) => matchDomain(base, d)));
  if (pool) return { name: pool.name, webUrl: pool.webUrl, identifier: pool.identifier };

  return { name: fallbackName(base), webUrl: null, identifier: null };
}
