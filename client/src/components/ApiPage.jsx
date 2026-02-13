import { useState, useEffect } from 'react';
import { useMiner } from '../context/MinerContext';
import { fetchMinerAsic, fetchNetworkStatus } from '../lib/api';
import { useConfig } from '../context/ConfigContext';

function ResponseCard({ title, path, data, error, loading }) {
  return (
    <div className="card min-w-0 flex flex-col">
      <h3 className="card-title">{title}</h3>
      <p className="text-muted-standalone text-sm mb-2 font-mono">{path}</p>
      {loading && <p className="text-muted-standalone text-sm">Loading…</p>}
      {error && <p className="text-danger dark:text-danger-dark text-sm">{error.message}</p>}
      {!loading && !error && data != null && (
        <pre className="api-pre flex-1 min-h-0">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
      {!loading && !error && data == null && <p className="text-muted-standalone text-sm">No data.</p>}
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
    <div className="space-y-6">
      <div className="card">
        <h2 className="card-title">Endpoints</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-edge dark:border-edge-dark">
                <th className="py-2 pr-4 font-medium text-muted-standalone">Method</th>
                <th className="py-2 pr-4 font-medium text-muted-standalone">Path</th>
                <th className="py-2 font-medium text-muted-standalone">Description</th>
              </tr>
            </thead>
            <tbody className="text-body">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ResponseCard
          title="API response:"
          path="GET /api/miner/info"
          data={miner}
          error={minerError}
          loading={minerLoading}
        />
        <ResponseCard
          title="API response:"
          path="GET /api/miner/asic"
          data={asic}
          error={asicError}
          loading={asicLoading}
        />
        <ResponseCard
          title="API response:"
          path="GET /api/network/status"
          data={network}
          error={networkError}
          loading={networkLoading}
        />
      </div>

      <div className="card">
        <h3 className="card-title">Related API settings</h3>
        <p className="text-muted-standalone text-sm mb-4">Constants and config that affect API polling and requests.</p>
        <h4 className="text-sm font-medium text-body mb-2">Client</h4>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm text-left table-fixed">
            <colgroup>
              <col className="w-52" />
            </colgroup>
            <thead>
              <tr className="border-b border-edge dark:border-edge-dark">
                <th className="py-2 pr-4 font-medium text-muted-standalone">Name</th>
                <th className="py-2 pr-4 font-medium text-muted-standalone">Source</th>
                <th className="py-2 pr-4 font-medium text-muted-standalone">Value</th>
                <th className="py-2 font-medium text-muted-standalone">Description</th>
              </tr>
            </thead>
            <tbody className="text-body">
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
        <h4 className="text-sm font-medium text-body mb-2">Server</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left table-fixed">
            <colgroup>
              <col className="w-52" />
            </colgroup>
            <thead>
              <tr className="border-b border-edge dark:border-edge-dark">
                <th className="py-2 pr-4 font-medium text-muted-standalone">Name</th>
                <th className="py-2 pr-4 font-medium text-muted-standalone">Source</th>
                <th className="py-2 pr-4 font-medium text-muted-standalone">Value</th>
                <th className="py-2 font-medium text-muted-standalone">Description</th>
              </tr>
            </thead>
            <tbody className="text-body">
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
        <h3 className="card-title">Query the API with cURL</h3>
        <p className="text-muted-standalone text-sm mb-4">Copy and run these commands in your terminal. The base URL uses your current origin.</p>
        <div className="rounded-lg overflow-hidden bg-[#1e1e1e] border border-edge dark:border-edge-dark shadow-inner">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#2d2d2d] border-b border-[#3d3d3d]">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
            <span className="text-xs text-gray-400 ml-2 font-medium">Terminal</span>
          </div>
          <div className="p-4 text-sm font-mono text-gray-300 overflow-x-auto space-y-2">
            {CURL_EXAMPLES.map(({ path, curl }) => (
              <div key={path} className="flex flex-wrap gap-x-2 items-baseline">
                <span className="text-green-400 select-none shrink-0">$</span>
                <code className="break-all">{origin ? curl(origin) : curl('http://localhost:3000')}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
