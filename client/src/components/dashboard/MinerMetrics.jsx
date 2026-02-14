import { useConfig } from '@/context/ConfigContext';
import { useMiner } from '@/context/MinerContext';
import { formatHashrate, formatPower,formatTemp } from '@/lib/formatters';
import { getGaugeColor, getGaugePercent } from '@/lib/metricRanges';
import { computeEfficiency } from '@/lib/minerMetrics';
import Gauge from '@/components/dashboard/Gauge';

export default function MinerMetrics() {
    const { data: miner } = useMiner();
    const efficiency = computeEfficiency(miner);
    const { config } = useConfig();
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <Gauge
                label="Hashrate"
                value={formatHashrate(miner?.hashRate)}
                sub={miner?.hashRate_1h != null ? `1h avg: ${formatHashrate(miner.hashRate_1h)}` : undefined}
                color={getGaugeColor(miner, 'hashrate')}
                percent={getGaugePercent(miner, 'hashrate')}
            />
            <Gauge
                label="Efficiency"
                value={efficiency != null ? `${efficiency.toFixed(1)} J/TH` : '--'}
                sub={miner != null ? `Expected: ${formatHashrate(miner.expectedHashrate ?? config.defaultExpectedHashrateGh)}` : undefined}
                color={getGaugeColor(miner, 'efficiency', efficiency)}
                percent={getGaugePercent(miner, 'efficiency', efficiency)}
            />
            <Gauge
                label="ASIC Temp"
                value={formatTemp(miner?.temp)}
                sub={miner?.vrTemp != null ? `VR: ${formatTemp(miner.vrTemp)}` : undefined}
                color={getGaugeColor(miner, 'temp')}
                percent={getGaugePercent(miner, 'temp')}
            />
            <Gauge
                label="Fan Speed"
                value={miner?.fanrpm != null ? `${miner.fanrpm} RPM` : '--'}
                sub={miner?.fanspeed != null
                    ? `${miner.fanspeed.toFixed(0)}% ${miner?.autofanspeed ? '(auto)' : '(manual)'}`
                    : undefined}
                color={getGaugeColor(miner, 'fanRpm')}
                percent={getGaugePercent(miner, 'fanRpm')}
            />
            <Gauge
                label="Input Current"
                value={miner?.current != null ? `${(miner.current / 1000).toFixed(2)} A` : '--'}
                sub={miner?.current != null ? `${miner.current.toFixed(0)} mA` : undefined}
                color={getGaugeColor(miner, 'current')}
                percent={getGaugePercent(miner, 'current')}
            />
            <Gauge
                label="ASIC Frequency"
                value={miner?.frequency != null ? `${miner.frequency} MHz` : '--'}
                sub={miner?.frequency != null && miner?.defaultFrequency != null
                    ? `${miner.frequency > miner.defaultFrequency ? '+' : ''}${((miner.frequency - miner.defaultFrequency) / miner.defaultFrequency * 100).toFixed(0)}% of default`
                    : undefined}
                color={getGaugeColor(miner, 'frequency')}
                percent={getGaugePercent(miner, 'frequency')}
            />
            <Gauge
                label="ASIC Voltage"
                value={miner?.coreVoltageActual != null ? `${miner.coreVoltageActual} mV` : '--'}
                sub={miner?.coreVoltage != null ? `Set: ${miner.coreVoltage} mV` : undefined}
                color={getGaugeColor(miner, 'voltage')}
                percent={getGaugePercent(miner, 'voltage')}
            />
            <Gauge
                label="Power"
                value={formatPower(miner?.power)}
                sub={miner?.voltage != null ? `${(miner.voltage / 1000).toFixed(2)} V input` : undefined}
                color={getGaugeColor(miner, 'power')}
                percent={getGaugePercent(miner, 'power')}
            />
        </div>
    );
}
