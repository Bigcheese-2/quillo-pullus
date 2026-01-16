"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { NoteSearch } from "@/components/notes/note-search";

interface AppHeaderProps {
  onMenuClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onEnableSelectionMode?: () => void;
  isSelectionMode?: boolean;
}

export function AppHeader({ 
  onMenuClick, 
  searchQuery = '', 
  onSearchChange,
  onEnableSelectionMode,
  isSelectionMode = false,
}: AppHeaderProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 w-full">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden rounded-lg shrink-0 h-9 w-9"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </Button>

      <h1 className="text-lg sm:text-xl font-bold text-accent lg:hidden shrink-0">Quillo</h1>

      <div className="flex-1 min-w-0">
        <NoteSearch
          value={searchQuery}
          onChange={onSearchChange || (() => {})}
          placeholder="Search notes..."
        />
      </div>
    </div>
  );
}

