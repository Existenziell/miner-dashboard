import { useConfig } from '@/context/ConfigContext';
import { useSystemData } from '@/hooks/useSystemData';
import { formatBytes, formatLoadAvg, formatPercent, formatUptime } from '@/lib/formatters';

function ItemGrid({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="stat-label">{item.label}</div>
          <div className="mt-0.5 truncate">
            <span className="stat-value">{item.value}</span>
          </div>
          {item.warning && (
            <div className="text-xs text-warning dark:text-warning-dark mt-0.5">{item.warning}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SystemStatus() {
  const { config } = useConfig();
  const { data, error, loading } = useSystemData(config?.pollSystemIntervalMs);

  if (!data && !loading && !error) return null;

  const totalBytes = data?.totalBytes ?? 0;
  const usedBytes = data?.usedBytes ?? 0;
  const usagePercent = data?.usagePercent;
  const mainItems = [
    { label: 'Load (1 / 5 / 15 min)', value: formatLoadAvg(data?.loadAvg) },
    { label: 'Cores', value: data?.cpuCount != null ? String(data.cpuCount) : '--' },
    { label: 'Uptime', value: formatUptime(data?.uptimeSeconds) },
    {
      label: 'Memory',
      value:
        totalBytes > 0
          ? `${formatBytes(usedBytes)} / ${formatBytes(totalBytes)} (${formatPercent(usagePercent)})`
          : '--',
      warning:
        usagePercent != null && usagePercent >= 90 ? 'High memory usage' : undefined,
    },
  ];

  const memItems = [];
  if (data?.memAvailableBytes != null && Number.isFinite(data.memAvailableBytes)) {
    memItems.push({
      label: 'Available',
      value: formatBytes(data.memAvailableBytes),
    });
  }
  if (
    data?.swapTotalBytes != null &&
    Number.isFinite(data.swapTotalBytes) &&
    data.swapTotalBytes > 0
  ) {
    const swapUsed = data.swapTotalBytes - (data.swapFreeBytes ?? 0);
    memItems.push({
      label: 'Swap',
      value: `${formatBytes(swapUsed)} / ${formatBytes(data.swapTotalBytes)}`,
    });
  }

  return (
    <div className="card">
      <div className="card-header-wrapper">
        <div className="card-header">
          <h2 className="card-header-title">System</h2>
          {error ? (
            <span className="flex items-center gap-1.5 text-danger dark:text-danger-dark text-sm">
              Unavailable
            </span>
          ) : loading ? (
            <span className="text-muted text-sm">Loading…</span>
          ) : (
            <span className="text-success dark:text-success-dark text-sm">OK</span>
          )}
        </div>
      </div>
      {data && (
        <>
          <section className={memItems.length > 0 ? 'mb-5' : ''}>
            <ItemGrid items={mainItems} />
          </section>
          {memItems.length > 0 && (
            <>
              <hr className="border-default my-6" />
              <section>
                <ItemGrid items={memItems} />
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
