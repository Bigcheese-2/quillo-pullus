"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Menu, Plus } from "lucide-react";
import { SyncStatusBadge } from "@/components/sync";

interface AppHeaderProps {
  onMenuClick?: () => void;
  onNewNote?: () => void;
}

export function AppHeader({ onMenuClick, onNewNote }: AppHeaderProps) {
  return (
    <div className="flex items-center gap-3 w-full">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden rounded-lg shrink-0"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Logo on mobile */}
      <h1 className="text-xl font-bold text-accent lg:hidden shrink-0">Quillo</h1>

      {/* Search input */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search notes..."
          className="pl-10 h-10 rounded-lg bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent/50 w-full"
        />
      </div>

      {/* Sync Status Badge */}
      <div className="hidden sm:flex shrink-0">
        <SyncStatusBadge />
      </div>

      {/* New Note button on mobile */}
      <Button
        onClick={onNewNote}
        className="lg:hidden bg-accent hover:bg-accent/90 text-white rounded-lg h-10 px-3 shrink-0"
        size="sm"
        aria-label="New Note"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

