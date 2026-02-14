import { useState } from 'react';
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
import { useDashboardContext } from '@/context/DashboardContext';
import { Field } from '@/components/settings/Field';

function MetricRangeCard({
  metric,
  metricRanges,
  setMetricRangeValue,
  METRIC_LABELS,
  METRIC_KEY_LABELS,
  isDropTarget = false,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: metric });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const keys = Object.keys(DASHBOARD_DEFAULTS.metricRanges[metric]);
  const values = metricRanges[metric] ?? {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md px-4 py-3 space-y-2 min-h-[160px] ${
        isDropTarget
          ? 'border-2 border-dashed border-edge dark:border-edge-dark bg-bg/50 dark:bg-bg-dark/50'
          : 'border border-edge dark:border-edge-dark'
      } ${isDragging ? 'opacity-0 pointer-events-none' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-body capitalize min-w-0">
          {METRIC_LABELS[metric] ?? metric}
          {isDropTarget && (
            <span className="ml-1 text-muted font-normal">(drop here)</span>
          )}
        </p>
        <div
          className="shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted hover:text-body p-1 -m-1"
          aria-label={`Drag to reorder ${METRIC_LABELS[metric] ?? metric}`}
          {...attributes}
          {...listeners}
        >
          <span className="select-none text-lg leading-none" aria-hidden="true">⋮⋮</span>
        </div>
      </div>
      <div className="space-y-2">
        {keys.map((key) => (
          <div key={key} className="flex items-center gap-2">
            <label className="text-xs text-muted shrink-0 min-w-[100px]" htmlFor={`metric-${metric}-${key}`}>
              {METRIC_KEY_LABELS[key] ?? key}
            </label>
            <input
              id={`metric-${metric}-${key}`}
              type="number"
              step={key.includes('Mv') || key.includes('Pct') ? 1 : 0.1}
              value={values[key] ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '') return;
                const num = Number(v);
                if (!Number.isNaN(num)) setMetricRangeValue(metric, key, num);
              }}
              className="input text-sm w-24"
              aria-label={`${METRIC_LABELS[metric] ?? metric} ${METRIC_KEY_LABELS[key] ?? key}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardConfig() {
  const {
    metricRanges,
    metricOrder,
    setMetricOrder,
    setMetricRangeValue,
    METRIC_LABELS,
    METRIC_KEY_LABELS,
  } = useDashboardContext();

  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);

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

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
    if (over == null || active.id === over.id) return;
    const ids = [...(metricOrder ?? Object.keys(DASHBOARD_DEFAULTS.metricRanges))];
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setMetricOrder(arrayMove(ids, oldIndex, newIndex));
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  const order = metricOrder ?? DASHBOARD_DEFAULTS.metricOrder ?? Object.keys(DASHBOARD_DEFAULTS.metricRanges);
  const overIndex = overId != null ? order.indexOf(overId) : -1;

  return (
    <div className="card">
      <div className="card-header-wrapper">
        <div className="card-header mb-4">
          <h3 className="card-header-title">Metric ranges</h3>
        </div>
      </div>
      <div className="space-y-4">
        <Field
          label="Metric ranges"
          hint="Customize display ranges and drag to reorder. Order here matches the gauge order on the dashboard."
        />
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={order} strategy={rectSortingStrategy}>
            <div className="flex flex-wrap gap-4 -mt-2">
              {order.map((metric, i) => (
                <div key={metric} className="w-[240px] min-h-[160px] shrink-0">
                  <MetricRangeCard
                    metric={metric}
                    metricRanges={metricRanges}
                    setMetricRangeValue={setMetricRangeValue}
                    METRIC_LABELS={METRIC_LABELS}
                    METRIC_KEY_LABELS={METRIC_KEY_LABELS}
                    isDropTarget={activeId != null && overId !== activeId && i === overIndex}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeId ? (
              <div className="shadow-lg rounded-md cursor-grabbing">
                <MetricRangeCard
                  metric={activeId}
                  metricRanges={metricRanges}
                  setMetricRangeValue={setMetricRangeValue}
                  METRIC_LABELS={METRIC_LABELS}
                  METRIC_KEY_LABELS={METRIC_KEY_LABELS}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        <p className="text-muted-standalone text-xs my-3 space-y-1.5">
          <span className="block"><strong>Gauge max:</strong> value that maps to 100% on the needle (the scale).</span>
          <span className="block"><strong>Min:</strong> lower bound for &quot;higher is better&quot; (hashrate, frequency).</span>
          <span className="block"><strong>Max:</strong> upper bound for &quot;lower is better&quot; (temp, power, efficiency, current).</span>
          <span className="block"><strong>Max (mV):</strong> allowed voltage deviation from set.</span>
        </p>
      </div>
    </div>
  );
}
