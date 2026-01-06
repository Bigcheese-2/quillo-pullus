'use client';

import { cn } from '@/lib/utils';

interface NoteSkeletonProps {
  className?: string;
}

export function NoteSkeleton({ className }: NoteSkeletonProps) {
  return (
    <div
      className={cn(
        'w-full p-3 md:p-4 rounded-lg bg-muted/50 animate-pulse',
        className
      )}
    >
      <div className="space-y-2">
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
        <div className="h-3 bg-muted-foreground/10 rounded w-full" />
        <div className="h-3 bg-muted-foreground/10 rounded w-2/3" />
        <div className="h-3 bg-muted-foreground/10 rounded w-1/4" />
      </div>
    </div>
  );
}


export function NoteSkeletons({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, index) => (
        <NoteSkeleton key={index} />
      ))}
    </div>
  );
}

