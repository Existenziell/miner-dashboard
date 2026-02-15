import { useConfig } from '@/context/ConfigContext';
import { useMiner } from '@/context/MinerContext';
import { LOW_HEAP_INT_THRESHOLD_BYTES } from '@/lib/constants';
import { formatBytes,formatResetReason, formatUptime } from '@/lib/formatters';

function StatusDot({ connected }) {
  return (
    <span
      className={`status-dot shrink-0 ${connected ? 'status-dot-success' : 'status-dot-danger'}`}
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
          {item.warning && (
            <div className="text-xs text-warning dark:text-warning-dark mt-0.5" title={item.warningTitle}>
              {item.warning}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function MinerStatus() {
  const { config } = useConfig();
  const { data, error: minerError, loading: minerLoading } = useMiner();
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
    { label: 'Free Heap', value: formatBytes(data.freeHeap) },
    {
      label: 'Free Heap (int RAM)',
      value: data.freeHeapInt != null ? formatBytes(data.freeHeapInt) : '--',
      warning: data.freeHeapInt != null && data.freeHeapInt < LOW_HEAP_INT_THRESHOLD_BYTES ? 'Low memory' : undefined,
      warningTitle: data.freeHeapInt != null && data.freeHeapInt < LOW_HEAP_INT_THRESHOLD_BYTES ? 'Internal RAM free heap is below 50 KB; device may become unstable.' : undefined,
    },
    { label: 'Running Partition', value: data.runningPartition ?? '--' },
    { label: 'Poll interval', value: `${(config.pollMinerIntervalMs / 1000).toFixed(0)} s` },
  ];

  return (
    <div className="card">
      <div className="card-header-wrapper">
        <div className="card-header">
          <h2 className="card-header-title flex items-center gap-2">
            Miner Status
          </h2>
        {minerError ? (
          <span className="flex items-center gap-1.5 text-danger dark:text-danger-dark text-sm">
            <span className="status-dot status-dot-danger" />
            Miner offline
          </span>
        ) : minerLoading ? (
          <span className="text-muted-standalone">Connecting...</span>
        ) : (
          <span className="flex items-center gap-1.5 text-success dark:text-success-dark text-sm">
            <span className="status-dot status-dot-success" />
            Connected
          </span>
        )}
        </div>
      </div>

      <section className="mb-5">
        <ItemGrid items={deviceItems} />
      </section>

      <hr className="border-default my-6" />

      <section className={hasHeap ? 'mb-5' : ''}>
        <ItemGrid items={networkItems} />
      </section>

      {hasHeap && (
        <>
          <hr className="border-default my-6" />
          <section>
            <ItemGrid items={heapItems} />
          </section>
        </>
      )}
    </div>
  );
}
