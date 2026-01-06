'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NoteSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onClear?: () => void;
}

export function NoteSearch({
  value,
  onChange,
  placeholder = 'Search notes...',
  className,
  onClear,
}: NoteSearchProps) {
  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'pl-10 pr-10 h-10 rounded-lg bg-muted border-border',
          'text-foreground placeholder:text-muted-foreground',
          'focus-visible:ring-2 focus-visible:ring-accent/50',
          'w-full transition-all duration-200'
        )}
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-muted/80"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

