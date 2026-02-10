function SettingRow({ label, value, highlight, truncate, href }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1">
      <span className="text-muted dark:text-muted-dark text-xs shrink-0">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sm text-right ${truncate ? 'truncate max-w-[250px]' : ''}`}
          title={truncate ? String(value) : undefined}
        >
          {value}
        </a>
      ) : (
        <span
          className={`text-sm text-right ${highlight ? 'text-btc-orange font-medium' : 'text-fg dark:text-fg-dark'} ${truncate ? 'truncate max-w-[250px]' : ''}`}
          title={truncate ? String(value) : undefined}
        >
          {value}
        </span>
      )}
    </div>
  );
}

/**
 * Known pool domain-to-name mappings.
 * Keys are matched against the base domain (without subdomain prefixes).
 */
const POOL_NAMES = {
  'viabtc.io':      'ViaBTC',
  'ckpool.org':     'CKPool',
  'pool.bitcoin.com': 'Bitcoin.com',
  'braiins.com':    'Braiins',
  'slushpool.com':  'Braiins (Slush)',
  'antpool.com':    'AntPool',
  'f2pool.com':     'F2Pool',
  'foundryusapool.com': 'Foundry USA',
  'luxor.tech':     'Luxor',
  'ocean.xyz':      'OCEAN',
  'kano.is':        'Kano',
  'poolin.com':     'Poolin',
  'public-pool.io': 'Public Pool',
  'solo.d-central.tech': 'D-Central Solo',
};

/** Extract the base domain from a stratum URL, stripping common prefixes. */
function baseDomain(stratumHost) {
  if (!stratumHost) return null;
  return stratumHost
    .replace(/^stratum\+tcp:\/\//, '')
    .replace(/^stratum2\+tcp:\/\//, '')
    .replace(/^(btc|stratum|solo|eu|us|eusolo|na|asia|ausolo)\./i, '');
}

/**
 * Stratum base domain → official pool website URL.
 * Stratum hosts (e.g. btc.viabtc.io) often differ from the pool’s real site.
 */
const POOL_WEB_URLS = {
  'viabtc.io':  'https://www.viabtc.com',
  'ckpool.org': 'https://eusolo.ckpool.org/',
  'bitcoin.com': 'https://www.bitcoin.com',
  'braiins.com': 'https://braiins.com',
  'slushpool.com': 'https://slushpool.com',
  'antpool.com': 'https://www.antpool.com',
  'f2pool.com': 'https://www.f2pool.com',
  'foundryusapool.com': 'https://www.foundrydigital.com',
  'luxor.tech': 'https://www.luxor.tech',
  'ocean.xyz': 'https://ocean.xyz',
  'kano.is': 'https://kano.is',
  'poolin.com': 'https://www.poolin.com',
  'public-pool.io': 'https://web.public-pool.io',
  'd-central.tech': 'https://d-central.tech',
};

/** Resolve the pool’s official website from the stratum host; null if unknown. */
function poolWebUrl(stratumHost) {
  const base = baseDomain(stratumHost);
  if (!base) return null;
  for (const [domain, url] of Object.entries(POOL_WEB_URLS)) {
    if (base === domain || base.endsWith(`.${domain}`)) return url;
  }
  return null;
}

/** Derive a human-friendly pool name from the stratum host. */
function poolName(stratumHost) {
  const base = baseDomain(stratumHost);
  if (!base) return null;
  // Check known mappings
  for (const [domain, name] of Object.entries(POOL_NAMES)) {
    if (base === domain || base.endsWith(`.${domain}`)) return name;
  }
  // Fallback: capitalise the first part of the domain
  const parts = base.split('.');
  return parts.length >= 2 ? parts[parts.length - 2] : base;
}

export default function MinerSettings({ data }) {
  if (!data) return null;

  const isUsingFallback = data.stratum?.usingFallback ?? data.isUsingFallbackStratum === 1;

  // Get pool-specific data if available
  const poolData = data.stratum?.pools?.[0];

  return (
    <div className="card">
      <h3 className="card-title">Pool & Settings</h3>

      {/* Primary Pool */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="label font-semibold">Primary Pool</span>
          {!isUsingFallback && (
            <span className="text-[10px] bg-success/20 dark:bg-success-dark/20 text-success dark:text-success-dark px-1.5 py-0.5 rounded font-medium">ACTIVE</span>
          )}
        </div>
        <div className="space-y-0.5">
          <SettingRow label="Name" value={poolName(data.stratumURL) || '--'} href={poolWebUrl(data.stratumURL)} />
          <SettingRow label="URL" value={data.stratumURL ? `${data.stratumURL}:${data.stratumPort || ''}` : '--'} />
          <SettingRow label="Worker" value={data.stratumUser || '--'} truncate />
          <SettingRow label="Pool Difficulty" value={poolData?.poolDifficulty ?? data.stratumDifficulty ?? data.poolDifficulty ?? '--'} />
          <SettingRow label="TLS" value={data.stratumTLS ? 'Enabled' : 'Disabled'} />
        </div>
      </div>

      {/* Fallback Pool */}
      <div className="pt-3 border-t border-border dark:border-border-dark">
        <div className="flex items-center gap-2 mb-2">
          <span className="label font-semibold">Fallback Pool</span>
          {isUsingFallback && (
            <span className="text-[10px] bg-warning/20 dark:bg-warning-dark/20 text-warning dark:text-warning-dark px-1.5 py-0.5 rounded font-medium">ACTIVE</span>
          )}
        </div>
        <div className="space-y-0.5">
          <SettingRow label="Name" value={poolName(data.fallbackStratumURL) || 'Not configured'} href={poolWebUrl(data.fallbackStratumURL)} />
          <SettingRow label="URL" value={data.fallbackStratumURL ? `${data.fallbackStratumURL}:${data.fallbackStratumPort || ''}` : '--'} />
          <SettingRow label="Worker" value={data.fallbackStratumUser || '--'} truncate />
          <SettingRow label="TLS" value={data.fallbackStratumTLS ? 'Enabled' : 'Disabled'} />
        </div>
      </div>
    </div>
  );
}
