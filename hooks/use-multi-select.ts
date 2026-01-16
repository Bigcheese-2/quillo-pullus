'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

export function useMultiSelect<T extends string | number>(initialSelection: Set<T> = new Set()) {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(initialSelection);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const toggleSelection = useCallback((id: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectRange = useCallback((ids: T[], startIndex: number, endIndex: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const start = Math.min(startIndex, endIndex);
      const end = Math.max(startIndex, endIndex);
      
      for (let i = start; i <= end; i++) {
        if (ids[i] !== undefined) {
          next.add(ids[i]);
        }
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: T[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    setLastSelectedIndex(null);
  }, []);

  const toggleSelectAll = useCallback((ids: T[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      if (allSelected) {
        return new Set();
      } else {
        return new Set(ids);
      }
    });
  }, []);

  const enableSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const isSelected = useCallback(
    (id: T) => selectedIds.has(id),
    [selectedIds]
  );

  const hasSelection = selectedIds.size > 0;
  const selectedCount = selectedIds.size;

  useEffect(() => {
    if (!hasSelection && isSelectionMode) {
      setIsSelectionMode(false);
    }
  }, [hasSelection, isSelectionMode]);

  return useMemo(() => ({
    selectedIds,
    isSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectAll,
    enableSelectionMode,
    isSelected,
    hasSelection,
    selectedCount,
    setSelectedIds,
    setIsSelectionMode,
    selectRange,
    lastSelectedIndex,
    setLastSelectedIndex,
  }), [
    selectedIds,
    isSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectAll,
    enableSelectionMode,
    isSelected,
    hasSelection,
    selectedCount,
    selectRange,
    lastSelectedIndex,
  ]);
}

