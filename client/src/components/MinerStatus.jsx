import { formatUptime, formatResetReason } from '../lib/formatters';
import { POLL_MINER_INTERVAL_MS } from '../lib/constants';
import { useMiner } from '../context/MinerContext';

function StatusDot({ connected }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${connected ? 'bg-green-500' : 'bg-red-500'}`}
      title={connected ? 'WiFi connected' : 'WiFi disconnected'}
      aria-hidden
    />
  );
}

function ItemGrid({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="stat-label">{item.label}</div>
          <div className="text-body text-sm font-medium mt-0.5 truncate flex items-center gap-2" title={String(item.value)}>
            {item.status != null && <StatusDot connected={item.status === 'connected'} />}
            <span className="truncate min-w-0">{item.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MinerStatus() {
  const { data } = useMiner();
  if (!data) return null;

  const deviceItems = [
    { label: 'Device', value: data.deviceModel || data.ASICModel || '--' },
    { label: 'ASIC', value: data.ASICModel || '--' },
    { label: 'Firmware', value: data.version || '--' },
    { label: 'Uptime', value: formatUptime(data.uptimeSeconds) },
    { label: 'ASICs', value: data.asicCount != null ? `${data.asicCount}x (${data.smallCoreCount?.toLocaleString() ?? '--'} cores)` : '--' },
    { label: 'Overheat Limit', value: data.overheat_temp != null ? `${data.overheat_temp}°C` : '--' },
    { label: 'Fan Mode', value: data.autofanspeed ? `Auto (PID, target ${data.pidTargetTemp ?? '--'}°C)` : 'Manual' },
    { label: 'Last Reset', value: formatResetReason(data.lastResetReason || data.resetReason) },
  ];

  const wifiConnected = data.wifiStatus != null && String(data.wifiStatus).toLowerCase().includes('connect');
  const networkItems = [
    {
      label: 'WiFi',
      value: data.wifiRSSI != null ? `${data.wifiRSSI} dBm (${data.ssid || ''})` : '--',
      status: data.wifiStatus != null ? (wifiConnected ? 'connected' : 'disconnected') : null,
    },
    { label: 'Hostname', value: data.hostname || '--' },
    { label: 'IP Address', value: data.hostip || data.ipv4 || '192.168.1.3' },
    { label: 'MAC', value: data.macAddr || '--' },
  ];

  const hasHeap = data.freeHeap != null || data.freeHeapInt != null || data.runningPartition != null;
  const heapItems = [
    { label: 'Free Heap', value: data.freeHeap != null ? `${data.freeHeap.toLocaleString()} B` : '--' },
    { label: 'Free Heap (int)', value: data.freeHeapInt != null ? data.freeHeapInt.toLocaleString() : '--' },
    { label: 'Running Partition', value: data.runningPartition ?? '--' },
    { label: 'Poll interval', value: `${(POLL_MINER_INTERVAL_MS / 1000).toFixed(0)} s` },
  ];

  return (
    <div className="card">
      <div className="bg-surface-light dark:bg-surface-light-dark -mx-5 -mt-5 px-5 py-3 rounded-t-xl mb-4">
        <h2 className="text-lg font-semibold text-body flex items-center gap-2">
          <span className="status-dot status-dot-success" />
          NerdQaxe++ Miner
        </h2>
      </div>

      <section className="mb-5">
        <ItemGrid items={deviceItems} />
      </section>

      <hr className="border-border dark:border-border-dark my-6" />

      <section className={hasHeap ? 'mb-5' : ''}>
        <ItemGrid items={networkItems} />
      </section>

      {hasHeap && (
        <>
          <hr className="border-border dark:border-border-dark my-6" />
          <section>
            <ItemGrid items={heapItems} />
          </section>
        </>
      )}
    </div>
  );
}
