"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Clock, Star, Archive, Trash2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const navigationItems: SidebarItem[] = [
  { icon: <Clock className="w-4 h-4" />, label: "Recent", active: true },
  { icon: <Star className="w-4 h-4" />, label: "Starred" },
  { icon: <Archive className="w-4 h-4" />, label: "Archive" },
  { icon: <Trash2 className="w-4 h-4" />, label: "Trash" },
];

const tags = ["work", "personal", "planning", "design"];

interface AppSidebarProps {
  onNewNote?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ onNewNote, isOpen = true, onClose }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 border-r border-border bg-background flex flex-col h-screen",
        "transition-transform duration-[250ms] ease-out will-change-transform",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-accent">Quillo</h1>
      </div>

      {/* New Note Button */}
      <div className="p-4 border-b border-border">
        <Button
          onClick={onNewNote}
          className="w-full bg-accent hover:bg-accent/90 text-white rounded-lg h-10 font-medium"
          size="default"
        >
          <span className="mr-2">+</span>
          New Note
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              item.active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Tags Section */}
      <div className="p-4 border-t border-border">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Tags
        </h2>
        <div className="space-y-1">
          {tags.map((tag) => (
            <button
              key={tag}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Tag className="w-4 h-4" />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

