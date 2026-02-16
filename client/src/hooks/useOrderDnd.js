import { useLayoutEffect, useRef, useState } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

/**
 * Encapsulates drag-and-drop state and handlers for reorderable lists.
 * @param {string[]} order - Current ordered list of item ids
 * @param {(ids: string[]) => void} setOrder - Callback to persist new order
 * @returns {{ dropZoneRect: object | null, cellRefs: React.MutableRefObject<(HTMLElement | null)[]>, sensors: object, handleDragStart: function, handleDragOver: function, handleDragEnd: function, handleDragCancel: function }}
 */
export function useOrderDnd(order, setOrder) {
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [dropZoneRect, setDropZoneRect] = useState(null);
  const cellRefs = useRef([]);

  const overIndex = overId != null ? order.indexOf(overId) : -1;
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
    setDropZoneRect(null);
    if (over == null || active.id === over.id) return;
    const ids = [...order];
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setOrder(arrayMove(ids, oldIndex, newIndex));
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
    setDropZoneRect(null);
  };

  return {
    dropZoneRect,
    cellRefs,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    activeId,
  };
}
