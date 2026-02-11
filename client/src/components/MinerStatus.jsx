import { formatUptime, formatResetReason } from '../lib/formatters';
import { useMiner } from '../context/MinerContext';

function ItemGrid({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="stat-label">{item.label}</div>
          <div className="text-body text-sm font-medium mt-0.5 truncate" title={String(item.value)}>
            {item.value}
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

  const networkItems = [
    { label: 'WiFi', value: data.wifiRSSI != null ? `${data.wifiRSSI} dBm (${data.ssid || ''})` : '--' },
    { label: 'Hostname', value: data.hostname || '--' },
    { label: 'IP Address', value: data.hostip || data.ipv4 || '192.168.1.3' },
    { label: 'MAC', value: data.macAddr || '--' },
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

      <section>
        <div className="stat-label mb-2">Network</div>
        <ItemGrid items={networkItems} />
      </section>
    </div>
  );
}
