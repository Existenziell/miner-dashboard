import { useEffect, useState } from 'react';
import { useConfig } from '@/context/ConfigContext';
import { useMiner } from '@/context/MinerContext';
import { fetchMinerAsic, fetchNetworkStatus } from '@/lib/api';
import { CURL_EXAMPLE_ORIGIN_FALLBACK } from '@/lib/constants';
import RealtimeLogs from '@/components/logs/RealtimeLogs';

function ResponseCard({ title, path, data, error, loading }) {
  return (
    <div className="card min-w-0 flex flex-col">
      <div className="card-header-wrapper">
        <div className="card-header">
          <h3 className="card-header-title">{title}</h3>
        </div>
      </div>
      <p className="text-muted text-sm mb-2 font-mono">{path}</p>
      {loading && <p className="text-muted text-sm">Loading…</p>}
      {error && <p className="text-danger dark:text-danger-dark text-sm">{error.message}</p>}
      {!loading && !error && data != null && (
        <pre className="api-pre flex-1 min-h-0">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
      {!loading && !error && data == null && <p className="text-muted text-sm">No data.</p>}
    </div>
  );
}

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/config', description: 'Dashboard config (poll intervals, metric ranges, miner IP, etc.)' },
  { method: 'PATCH', path: '/api/config', description: 'Update dashboard config (partial JSON body)' },
  { method: 'GET', path: '/api/miner/info', description: 'Miner system info (optional query: ts, cur)' },
  { method: 'GET', path: '/api/miner/asic', description: 'ASIC options (frequency/voltage)' },
  { method: 'PATCH', path: '/api/miner/settings', description: 'Update miner settings' },
  { method: 'POST', path: '/api/miner/restart', description: 'Restart miner' },
  { method: 'POST', path: '/api/miner/shutdown', description: 'Shutdown miner' },
  { method: 'GET', path: '/api/firmware/releases', description: 'GitHub firmware releases (query: includePrereleases)' },
  { method: 'POST', path: '/api/firmware/download', description: 'Download firmware from URL and verify checksum (JSON: url, expectedSha256?). Returns binary + X-* headers.' },
  { method: 'POST', path: '/api/miner/firmware/install', description: 'Install firmware from URL (JSON: url, keepSettings?, expectedSha256?)' },
  { method: 'POST', path: '/api/miner/firmware/flash', description: 'Flash firmware or www file (multipart file, query: type=firmware|www)' },
  { method: 'GET', path: '/api/network/status', description: 'Bitcoin network data' },
];

const SERVER_SETTINGS = [
  { name: 'MINER_IP', source: 'env or dashboard config', value: '(env or config)', description: 'Miner device IP/host for proxy requests' },
  { name: 'MEMPOOL_API', source: 'network.js', value: 'https://mempool.space/api', description: 'Mempool.space API base URL for network data' },
  { name: 'CACHE_TTL_MS', source: 'network.js', value: '30_000', description: 'Network route response cache TTL (ms)' },
];

const CURL_EXAMPLES = [
  { method: 'GET', path: '/api/miner/info', curl: (origin) => `curl -s "${origin}/api/miner/info"` },
  { method: 'GET', path: '/api/miner/info (with query)', curl: (origin) => `curl -s "${origin}/api/miner/info?ts=1&cur=1"` },
  { method: 'GET', path: '/api/miner/asic', curl: (origin) => `curl -s "${origin}/api/miner/asic"` },
  { method: 'GET', path: '/api/network/status', curl: (origin) => `curl -s "${origin}/api/network/status"` },
  { method: 'PATCH', path: '/api/miner/settings', curl: (origin) => `curl -s -X PATCH "${origin}/api/miner/settings" -H "Content-Type: application/json" -d '{"frequency":650}'` },
  { method: 'POST', path: '/api/miner/restart', curl: (origin) => `curl -s -X POST "${origin}/api/miner/restart"` },
  { method: 'POST', path: '/api/miner/shutdown', curl: (origin) => `curl -s -X POST "${origin}/api/miner/shutdown"` },
];

export default function ApiPage() {
  const [origin] = useState(() => typeof window !== 'undefined' ? window.location.origin : '');
  const { config } = useConfig();
  const { data: miner, error: minerError, loading: minerLoading } = useMiner();

  const clientSettings = [
    { name: 'pollMinerIntervalMs', source: 'dashboard config', value: `${config.pollMinerIntervalMs}`, description: 'Miner status poll interval (ms)' },
    { name: 'pollNetworkIntervalMs', source: 'dashboard config', value: `${config.pollNetworkIntervalMs}`, description: 'Network status poll interval (ms)' },
    { name: 'pollSystemIntervalMs', source: 'dashboard config', value: `${config.pollSystemIntervalMs}`, description: 'System (host) metrics poll interval (ms)' },
    { name: 'BASE', source: 'api.js', value: "'' (same-origin)", description: 'Base URL for API requests' },
  ];
  const [asic, setAsic] = useState(null);
  const [asicError, setAsicError] = useState(null);
  const [asicLoading, setAsicLoading] = useState(true);
  const [network, setNetwork] = useState(null);
  const [networkError, setNetworkError] = useState(null);
  const [networkLoading, setNetworkLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMinerAsic()
      .then((data) => { if (!cancelled) setAsic(data); })
      .catch((err) => { if (!cancelled) setAsicError(err); })
      .finally(() => { if (!cancelled) setAsicLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchNetworkStatus()
      .then((data) => { if (!cancelled) setNetwork(data); })
      .catch((err) => { if (!cancelled) setNetworkError(err); })
      .finally(() => { if (!cancelled) setNetworkLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header">
            <h2 className="card-header-title">Endpoints</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-edge/60 dark:border-edge-dark/60">
                <th className="py-2 pr-4 font-medium text-muted">Method</th>
                <th className="py-2 pr-4 font-medium text-muted">Path</th>
                <th className="py-2 font-medium text-muted">Description</th>
              </tr>
            </thead>
            <tbody className="text-normal">
              {API_ENDPOINTS.map((ep) => (
                <tr key={ep.method + ep.path} className="border-b border-edge/60 dark:border-edge-dark/60">
                  <td className="py-2 pr-4 font-mono text-xs">{ep.method}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{ep.path}</td>
                  <td className="py-2">{ep.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <RealtimeLogs />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ResponseCard
          title="GET /api/miner/info"
          data={miner}
          error={minerError}
          loading={minerLoading}
        />
        <ResponseCard
          title="GET /api/miner/asic"
          data={asic}
          error={asicError}
          loading={asicLoading}
        />
        <ResponseCard
          title="GET /api/network/status"
          data={network}
          error={networkError}
          loading={networkLoading}
        />
      </div>

      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header">
            <h3 className="card-header-title">Related API settings</h3>
          </div>
        </div>
        <p className="card-subtitle">Constants and config that affect API polling and requests.</p>
        <h4 className="text-sm font-medium text-normal mb-2">Client</h4>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm text-left table-fixed">
            <colgroup>
              <col className="w-52" />
            </colgroup>
            <thead>
              <tr className="border-b border-edge/60 dark:border-edge-dark/60">
                <th className="py-2 pr-4 font-medium text-muted">Name</th>
                <th className="py-2 pr-4 font-medium text-muted">Source</th>
                <th className="py-2 pr-4 font-medium text-muted">Value</th>
                <th className="py-2 font-medium text-muted">Description</th>
              </tr>
            </thead>
            <tbody className="text-normal">
              {clientSettings.map((s) => (
                <tr key={s.name} className="border-b border-edge/60 dark:border-edge-dark/60">
                  <td className="py-2 pr-4 font-mono text-xs">{s.name}</td>
                  <td className="py-2 pr-4">{s.source}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{s.value}</td>
                  <td className="py-2">{s.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h4 className="text-sm font-medium text-normal mb-2">Server</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left table-fixed">
            <colgroup>
              <col className="w-52" />
            </colgroup>
            <thead>
              <tr className="border-b border-edge/60 dark:border-edge-dark/60">
                <th className="py-2 pr-4 font-medium text-muted">Name</th>
                <th className="py-2 pr-4 font-medium text-muted">Source</th>
                <th className="py-2 pr-4 font-medium text-muted">Value</th>
                <th className="py-2 font-medium text-muted">Description</th>
              </tr>
            </thead>
            <tbody className="text-normal">
              {SERVER_SETTINGS.map((s) => (
                <tr key={s.name} className="border-b border-edge/60 dark:border-edge-dark/60">
                  <td className="py-2 pr-4 font-mono text-xs">{s.name}</td>
                  <td className="py-2 pr-4">{s.source}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{s.value}</td>
                  <td className="py-2">{s.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header">
            <h3 className="card-header-title">Query the API with cURL</h3>
          </div>
        </div>
        <p className="card-subtitle">Copy and run these commands in your terminal. The base URL uses your current origin.</p>
        <div className="rounded-md overflow-hidden bg-terminal-bg border border-terminal-border shadow-inner">
          <div className="flex items-center gap-2 px-3 py-2 bg-terminal-bar border-b border-terminal-border">
            <span className="w-3 h-3 rounded-full bg-terminal-dot-close" />
            <span className="w-3 h-3 rounded-full bg-terminal-dot-minimize" />
            <span className="w-3 h-3 rounded-full bg-terminal-dot-open" />
            <span className="text-xs text-terminal-label ml-2 font-medium">Terminal</span>
          </div>
          <div className="p-4 text-sm font-mono text-terminal-text overflow-x-auto space-y-2">
            {CURL_EXAMPLES.map(({ path, curl }) => (
              <div key={path} className="flex flex-wrap gap-x-2 items-baseline">
                <span className="text-terminal-prompt select-none shrink-0">$</span>
                <code className="break-all">{origin ? curl(origin) : curl(CURL_EXAMPLE_ORIGIN_FALLBACK)}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
