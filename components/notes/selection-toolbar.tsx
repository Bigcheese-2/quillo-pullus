"use client";

import { Button } from "@/components/ui/button";
import { Archive, Trash2, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoteView } from "@/lib/types/note";

interface SelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  view?: NoteView;
  className?: string;
}

export function SelectionToolbar({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  onArchive,
  onDelete,
  onRestore,
  view = 'all',
  className,
}: SelectionToolbarProps) {
  if (selectedCount === 0) return null;
  
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg",
        "lg:relative lg:shadow-none lg:border-t-0 lg:border-b",
        "animate-in slide-in-from-bottom lg:slide-in-from-top",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">
            {selectedCount} {selectedCount === 1 ? 'note' : 'notes'} selected
          </span>
          {onSelectAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {view === 'trash' && onRestore && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRestore}
              className="h-8"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Restore
            </Button>
          )}
          
          {view === 'trash' && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="h-8"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          )}

          {view !== 'trash' && onArchive && (
            <Button
              variant="outline"
              size="sm"
              onClick={onArchive}
              className="h-8"
            >
              <Archive className="h-4 w-4 mr-1.5" />
              Archive
            </Button>
          )}

          {view !== 'trash' && onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="h-8"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

