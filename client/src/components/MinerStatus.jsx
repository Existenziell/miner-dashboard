import { formatUptime, formatResetReason } from '../lib/formatters';

export default function MinerStatus({ data }) {
  if (!data) return null;

  const items = [
    { label: 'Device', value: data.deviceModel || data.ASICModel || '--' },
    { label: 'ASIC', value: data.ASICModel || '--' },
    { label: 'Firmware', value: data.version || '--' },
    { label: 'Hostname', value: data.hostname || '--' },
    { label: 'IP Address', value: data.hostip || data.ipv4 || '192.168.1.3' },
    { label: 'MAC', value: data.macAddr || '--' },
    { label: 'Uptime', value: formatUptime(data.uptimeSeconds) },
    { label: 'WiFi', value: data.wifiRSSI != null ? `${data.wifiRSSI} dBm (${data.ssid || ''})` : '--' },
    { label: 'ASICs', value: data.asicCount != null ? `${data.asicCount}x (${data.smallCoreCount?.toLocaleString() ?? '--'} cores)` : '--' },
    { label: 'Overheat Limit', value: data.overheat_temp != null ? `${data.overheat_temp}°C` : '--' },
    { label: 'Fan Mode', value: data.autofanspeed ? `Auto (PID, target ${data.pidTargetTemp ?? '--'}°C)` : 'Manual' },
    { label: 'Last Reset', value: formatResetReason(data.lastResetReason || data.resetReason) },
  ];

  return (
    <div className="bg-surface-card rounded-xl p-5 border border-[var(--c-border)]">
      <h2 className="text-lg font-semibold text-btc-orange mb-4 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
        NerdQaxe++ Miner
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="text-text-secondary text-xs uppercase tracking-wide">{item.label}</div>
            <div className="text-text-primary text-sm font-medium mt-0.5 truncate" title={String(item.value)}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
