'use client';

import { useSyncStatus } from '@/hooks/use-sync-status';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Wifi, 
  WifiOff,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for the SyncStatusBadge component.
 * A lightweight badge-only version of SyncStatus.
 */
interface SyncStatusBadgeProps {
  /**
   * Additional CSS classes to apply.
   */
  className?: string;
  
  /**
   * Whether to show operation counts.
   * @default true
   */
  showCounts?: boolean;
}

/**
 * Lightweight sync status badge component.
 * Displays only the status indicator without the sync button.
 * Useful for compact UI areas like headers or sidebars.
 * 
 * @param props - Component props
 */
export function SyncStatusBadge({ 
  className,
  showCounts = true,
}: SyncStatusBadgeProps) {
  const { syncState } = useSyncStatus();

  /**
   * Gets the status badge configuration based on sync state.
   */
  const getStatusConfig = () => {
    if (!syncState.isOnline) {
      return {
        icon: WifiOff,
        label: 'Offline',
        variant: 'outline' as const,
        className: 'text-muted-foreground',
      };
    }

    switch (syncState.status) {
      case 'synced':
        return {
          icon: CheckCircle2,
          label: 'Synced',
          variant: 'default' as const,
          className: 'text-green-600 dark:text-green-400',
        };
      case 'syncing':
        return {
          icon: Loader2,
          label: 'Syncing',
          variant: 'secondary' as const,
          className: 'text-blue-600 dark:text-blue-400 animate-spin',
        };
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          variant: 'secondary' as const,
          className: 'text-yellow-600 dark:text-yellow-400',
        };
      case 'failed':
        return {
          icon: AlertCircle,
          label: 'Failed',
          variant: 'destructive' as const,
          className: 'text-red-600 dark:text-red-400',
        };
      default:
        return {
          icon: CheckCircle2,
          label: 'Unknown',
          variant: 'outline' as const,
          className: 'text-muted-foreground',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const hasPendingOperations = syncState.pendingCount > 0 || syncState.failedCount > 0;

  return (
    <Badge 
      variant={statusConfig.variant}
      className={cn(
        'flex items-center gap-1.5 text-xs',
        statusConfig.className,
        className
      )}
    >
      <StatusIcon className="h-3 w-3" />
      <span>{statusConfig.label}</span>
      {showCounts && hasPendingOperations && (
        <span className="ml-1">
          ({syncState.pendingCount > 0 && `${syncState.pendingCount}`}
          {syncState.pendingCount > 0 && syncState.failedCount > 0 && '/'}
          {syncState.failedCount > 0 && `${syncState.failedCount}`})
        </span>
      )}
    </Badge>
  );
}

