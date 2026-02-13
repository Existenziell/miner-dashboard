import MetricGauge from './MetricGauge';
import { useMiner } from '../context/MinerContext';
import { useConfig } from '../context/ConfigContext';
import { formatHashrate, formatTemp, formatPower } from '../lib/formatters';
import { getMetricColor, getMetricGaugePercent } from '../lib/metricRanges';
import { computeEfficiency } from '../lib/minerMetrics';

export default function Metrics() {
    const { data: miner } = useMiner();
    const efficiency = computeEfficiency(miner);
    const { config } = useConfig();
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <MetricGauge
                label="Hashrate"
                value={formatHashrate(miner?.hashRate)}
                sub={miner?.hashRate_1h != null ? `1h avg: ${formatHashrate(miner.hashRate_1h)}` : undefined}
                color={getMetricColor(miner, 'hashrate')}
                percent={getMetricGaugePercent(miner, 'hashrate')}
            />
            <MetricGauge
                label="Efficiency"
                value={efficiency != null ? `${efficiency.toFixed(1)} J/TH` : '--'}
                sub={miner != null ? `Expected: ${formatHashrate(miner.expectedHashrate ?? config.defaultExpectedHashrateGh)}` : undefined}
                color={getMetricColor(miner, 'efficiency', efficiency)}
                percent={getMetricGaugePercent(miner, 'efficiency', efficiency)}
            />
            <MetricGauge
                label="ASIC Temp"
                value={formatTemp(miner?.temp)}
                sub={miner?.vrTemp != null ? `VR: ${formatTemp(miner.vrTemp)}` : undefined}
                color={getMetricColor(miner, 'temp')}
                percent={getMetricGaugePercent(miner, 'temp')}
            />
            <MetricGauge
                label="Fan Speed"
                value={miner?.fanrpm != null ? `${miner.fanrpm} RPM` : '--'}
                sub={miner?.fanspeed != null
                    ? `${miner.fanspeed.toFixed(0)}% ${miner?.autofanspeed ? '(auto)' : '(manual)'}`
                    : undefined}
                color={getMetricColor(miner, 'fanRpm')}
                percent={getMetricGaugePercent(miner, 'fanRpm')}
            />
            <MetricGauge
                label="Input Current"
                value={miner?.current != null ? `${(miner.current / 1000).toFixed(2)} A` : '--'}
                sub={miner?.current != null ? `${miner.current.toFixed(0)} mA` : undefined}
                color={getMetricColor(miner, 'current')}
                percent={getMetricGaugePercent(miner, 'current')}
            />
            <MetricGauge
                label="ASIC Frequency"
                value={miner?.frequency != null ? `${miner.frequency} MHz` : '--'}
                sub={miner?.frequency != null && miner?.defaultFrequency != null
                    ? `${miner.frequency > miner.defaultFrequency ? '+' : ''}${((miner.frequency - miner.defaultFrequency) / miner.defaultFrequency * 100).toFixed(0)}% of default`
                    : undefined}
                color={getMetricColor(miner, 'frequency')}
                percent={getMetricGaugePercent(miner, 'frequency')}
            />
            <MetricGauge
                label="ASIC Voltage"
                value={miner?.coreVoltageActual != null ? `${miner.coreVoltageActual} mV` : '--'}
                sub={miner?.coreVoltage != null ? `Set: ${miner.coreVoltage} mV` : undefined}
                color={getMetricColor(miner, 'voltage')}
                percent={getMetricGaugePercent(miner, 'voltage')}
            />
            <MetricGauge
                label="Power"
                value={formatPower(miner?.power)}
                sub={miner?.voltage != null ? `${(miner.voltage / 1000).toFixed(2)} V input` : undefined}
                color={getMetricColor(miner, 'power')}
                percent={getMetricGaugePercent(miner, 'power')}
            />
        </div>
    );
}