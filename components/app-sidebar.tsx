"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Clock, Archive, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NoteView } from "@/lib/types/note";

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  view: NoteView;
  count?: number;
}

interface AppSidebarProps {
  onNewNote?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  currentView?: NoteView;
  onViewChange?: (view: NoteView) => void;
  counts?: {
    all: number;
    archived: number;
    trash: number;
  };
}

export function AppSidebar({ 
  onNewNote, 
  isOpen = true, 
  onClose,
  currentView = 'all',
  onViewChange,
  counts,
}: AppSidebarProps) {
  const handleViewClick = (view: NoteView) => {
    onViewChange?.(view);
    onClose?.();
  };

  const navigationItems: SidebarItem[] = [
    { 
      icon: <Clock className="w-4 h-4" />, 
      label: "All Notes", 
      view: "all",
      count: counts?.all,
    },
    { 
      icon: <Archive className="w-4 h-4" />, 
      label: "Archive", 
      view: "archived",
      count: counts?.archived,
    },
    { 
      icon: <Trash2 className="w-4 h-4" />, 
      label: "Trash", 
      view: "trash",
      count: counts?.trash,
    },
  ];

  return (
    <aside
      className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 border-r border-border lg:rounded-xl bg-background flex flex-col h-full",
        "transition-transform duration-250 ease-out will-change-transform",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="border-b border-border">
        <div className="px-6 py-5">
          <h1 className="text-2xl font-bold text-accent">Quillo</h1>
        </div>
      </div>

      {currentView === 'all' && (
        <div className="border-b border-border">
          <div className="p-4">
            <Button
              onClick={onNewNote}
              className="w-full bg-accent hover:bg-accent/90 text-white rounded-lg h-10 font-medium"
              size="default"
            >
              <span className="mr-2">+</span>
              New Note
            </Button>
          </div>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => (
          <button
            key={item.view}
            onClick={() => handleViewClick(item.view)}
            className={cn(
              "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              currentView === item.view
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.label}</span>
            </div>
            {item.count !== undefined && (
              <span className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded",
                currentView === item.view
                  ? "bg-background/50 text-foreground"
                  : "bg-muted-foreground/20 text-muted-foreground"
              )}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </nav>

    </aside>
  );
}