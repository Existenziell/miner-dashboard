import { formatUptime, formatResetReason } from '../lib/formatters';

function ItemGrid({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="stat-label">{item.label}</div>
          <div className="text-fg dark:text-fg-dark text-sm font-medium mt-0.5 truncate" title={String(item.value)}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MinerStatus({ data }) {
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

  const networkItems = [
    { label: 'WiFi', value: data.wifiRSSI != null ? `${data.wifiRSSI} dBm (${data.ssid || ''})` : '--' },
    { label: 'Hostname', value: data.hostname || '--' },
    { label: 'IP Address', value: data.hostip || data.ipv4 || '192.168.1.3' },
    { label: 'MAC', value: data.macAddr || '--' },
  ];

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-fg dark:text-fg-dark mb-4 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
        NerdQaxe++ Miner
      </h2>

      <section className="mb-5">
        <ItemGrid items={deviceItems} />
      </section>

      <section className="mt-8">
        <ItemGrid items={networkItems} />
      </section>
    </div>
  );
}
