import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { useConfig } from '@/context/ConfigContext';
import { useMiner } from '@/context/MinerContext';
import { patchDashboardConfig } from '@/lib/api';
import { formatHashrate, formatPower, formatTemp } from '@/lib/formatters';
import { getGaugeColor, getGaugePercent } from '@/lib/metricRanges';
import { computeEfficiency } from '@/lib/minerMetrics';
import Gauge from '@/components/dashboard/Gauge';

function getOrderedMetricIds(config) {
  const order = config?.metricOrder ?? DASHBOARD_DEFAULTS.metricOrder;
  const known = new Set(Object.keys(DASHBOARD_DEFAULTS.metricRanges));
  if (!Array.isArray(order)) return Object.keys(DASHBOARD_DEFAULTS.metricRanges);
  return order.filter((id) => known.has(id));
}

function SortableGauge({ id, isDragActive, ...gaugeProps }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragActive ? transition : 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${isDragging ? 'opacity-0 pointer-events-none' : ''}`}
    >
      <div
        className="absolute top-0 right-1 z-10 cursor-grab active:cursor-grabbing touch-none p-1 rounded opacity-0 transition-opacity group-hover:opacity-100 text-muted hover:text-body"
        aria-label={`Drag to reorder ${gaugeProps.label}`}
        {...attributes}
        {...listeners}
      >
        <span className="select-none text-lg leading-none" aria-hidden="true">⋮⋮</span>
      </div>
      <Gauge {...gaugeProps} />
    </div>
  );
}

export default function MinerMetrics() {
  const { data: miner } = useMiner();
  const efficiency = useMemo(() => computeEfficiency(miner), [miner]);
  const { config, refetch } = useConfig();

  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [dropZoneRect, setDropZoneRect] = useState(null);
  const cellRefs = useRef([]);

  const orderedIds = useMemo(() => getOrderedMetricIds(config), [config]);
  const overIndex = overId != null ? orderedIds.indexOf(overId) : -1;
  const showDropZone = activeId != null && overId !== activeId && overIndex >= 0;

  useLayoutEffect(() => {
    if (!showDropZone || overIndex < 0 || !cellRefs.current[overIndex]) {
      queueMicrotask(() => setDropZoneRect(null));
      return;
    }
    const el = cellRefs.current[overIndex];
    const rect = el.getBoundingClientRect();
    const next = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    queueMicrotask(() => setDropZoneRect(next));
  }, [showDropZone, overIndex]);

  const gaugeProps = useMemo(() => {
    const props = {
      hashrate: {
        label: 'Hashrate',
        value: formatHashrate(miner?.hashRate),
        sub: miner?.hashRate_1h != null ? `1h avg: ${formatHashrate(miner.hashRate_1h)}` : undefined,
        color: getGaugeColor(miner, 'hashrate'),
        percent: getGaugePercent(miner, 'hashrate'),
      },
      efficiency: {
        label: 'Efficiency',
        value: efficiency != null ? `${efficiency.toFixed(1)} J/TH` : '--',
        sub: miner != null ? `Expected: ${formatHashrate(miner.expectedHashrate ?? config?.defaultExpectedHashrateGh ?? 6000)}` : undefined,
        color: getGaugeColor(miner, 'efficiency', efficiency),
        percent: getGaugePercent(miner, 'efficiency', efficiency),
      },
      temp: {
        label: 'ASIC Temp',
        value: formatTemp(miner?.temp),
        sub: miner?.vrTemp != null ? `VR: ${formatTemp(miner.vrTemp)}` : undefined,
        color: getGaugeColor(miner, 'temp'),
        percent: getGaugePercent(miner, 'temp'),
      },
      fanRpm: {
        label: 'Fan Speed',
        value: miner?.fanrpm != null ? `${miner.fanrpm} RPM` : '--',
        sub: miner?.fanspeed != null
          ? `${miner.fanspeed.toFixed(0)}% ${miner?.autofanspeed ? '(auto)' : '(manual)'}`
          : undefined,
        color: getGaugeColor(miner, 'fanRpm'),
        percent: getGaugePercent(miner, 'fanRpm'),
      },
      current: {
        label: 'Input Current',
        value: miner?.current != null ? `${(miner.current / 1000).toFixed(2)} A` : '--',
        sub: miner?.current != null ? `${miner.current.toFixed(0)} mA` : undefined,
        color: getGaugeColor(miner, 'current'),
        percent: getGaugePercent(miner, 'current'),
      },
      frequency: {
        label: 'ASIC Frequency',
        value: miner?.frequency != null ? `${miner.frequency} MHz` : '--',
        sub: miner?.frequency != null && miner?.defaultFrequency != null
          ? `${miner.frequency > miner.defaultFrequency ? '+' : ''}${((miner.frequency - miner.defaultFrequency) / miner.defaultFrequency * 100).toFixed(0)}% of default`
          : undefined,
        color: getGaugeColor(miner, 'frequency'),
        percent: getGaugePercent(miner, 'frequency'),
      },
      voltage: {
        label: 'ASIC Voltage',
        value: miner?.coreVoltageActual != null ? `${miner.coreVoltageActual} mV` : '--',
        sub: miner?.coreVoltage != null ? `Set: ${miner.coreVoltage} mV` : undefined,
        color: getGaugeColor(miner, 'voltage'),
        percent: getGaugePercent(miner, 'voltage'),
      },
      power: {
        label: 'Power',
        value: formatPower(miner?.power),
        sub: miner?.voltage != null ? `${(miner.voltage / 1000).toFixed(2)} V input` : undefined,
        color: getGaugeColor(miner, 'power'),
        percent: getGaugePercent(miner, 'power'),
      },
    };
    return props;
  }, [miner, efficiency, config?.defaultExpectedHashrateGh]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const next = event.over?.id ?? null;
    setOverId((prev) => (next === prev ? prev : next));
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
    setDropZoneRect(null);
    if (over == null || active.id === over.id) return;
    const order = [...orderedIds];
    const oldIndex = order.indexOf(active.id);
    const newIndex = order.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(order, oldIndex, newIndex);
    try {
      await patchDashboardConfig({ metricOrder: newOrder });
      await refetch();
    } catch {
      // leave order unchanged on error
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
    setDropZoneRect(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {orderedIds.map((id, i) => {
            const p = gaugeProps[id];
            if (!p) return null;
            return (
              <div
                key={id}
                ref={(el) => { cellRefs.current[i] = el; }}
                className="min-h-0"
              >
                <SortableGauge id={id} isDragActive={activeId != null} {...p} />
              </div>
            );
          })}
        </div>
      </SortableContext>
      {dropZoneRect && (
        <div
          className="pointer-events-none fixed z-20 rounded-md box-border drop-zone-indicator"
          style={{
            top: dropZoneRect.top,
            left: dropZoneRect.left,
            width: dropZoneRect.width,
            height: dropZoneRect.height,
          }}
          aria-hidden
        />
      )}
      <DragOverlay dropAnimation={null}>
        {activeId && gaugeProps[activeId] ? (
          <div className="shadow-xl rounded-md cursor-grabbing">
            <Gauge {...gaugeProps[activeId]} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
