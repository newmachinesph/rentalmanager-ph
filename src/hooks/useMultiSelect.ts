import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

export function useMultiSelect<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Track items by their IDs (stable string) instead of array reference,
  // so that .slice() producing a new array doesn't clear selection.
  const itemIdsKey = useMemo(() => items.map((i) => i.id).join('\0'), [items]);
  const prevKeyRef = useRef(itemIdsKey);

  useEffect(() => {
    if (prevKeyRef.current !== itemIdsKey) {
      prevKeyRef.current = itemIdsKey;
      setSelectedIds((prev) => (prev.size > 0 ? new Set() : prev));
    }
  }, [itemIdsKey]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === items.length && items.length > 0) return new Set();
      return new Set(items.map((i) => i.id));
    });
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const allSelected = useMemo(
    () => items.length > 0 && selectedIds.size === items.length,
    [items.length, selectedIds.size],
  );

  const someSelected = useMemo(
    () => selectedIds.size > 0 && selectedIds.size < items.length,
    [items.length, selectedIds.size],
  );

  return { selectedIds, toggleOne, toggleAll, clearSelection, allSelected, someSelected };
}
