'use client';

import { useSyncStatus } from '@/hooks/use-sync-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Props for the SyncStatus component.
 */
interface SyncStatusProps {
  /**
   * Additional CSS classes to apply to the container.
   */
  className?: string;
  
  /**
   * Whether to show the manual sync button.
   * @default true
   */
  showSyncButton?: boolean;
  
  /**
   * Size variant for the component.
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
}

/**
 * SyncStatus component displays the current sync state with visual indicators.
 * 
 * Features:
 * - Visual status indicator (badge with icon)
 * - Pending and failed operation counts
 * - Online/offline indicator
 * - Manual sync button
 * - Error notifications
 * 
 * @param props - Component props
 */
export function SyncStatus({ 
  className, 
  showSyncButton = true,
  size = 'default',
}: SyncStatusProps) {
  const { syncState, isSyncing, lastError, triggerSync } = useSyncStatus();

  /**
   * Handles manual sync trigger.
   */
  const handleSync = async () => {
    try {
      const syncedCount = await triggerSync();
      if (syncedCount > 0) {
        toast.success(`Synced ${syncedCount} operation${syncedCount > 1 ? 's' : ''}`);
      } else {
        toast.info('No pending operations to sync');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync';
      toast.error(errorMessage);
    }
  };

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

  // Size variants
  const sizeClasses = {
    sm: 'text-xs gap-1',
    default: 'text-sm gap-1.5',
    lg: 'text-base gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Online/Offline Indicator */}
      <div className="flex items-center gap-1">
        {syncState.isOnline ? (
          <Wifi className={cn(iconSizes[size], 'text-green-600 dark:text-green-400')} />
        ) : (
          <WifiOff className={cn(iconSizes[size], 'text-muted-foreground')} />
        )}
      </div>

      {/* Status Badge */}
      <Badge 
        variant={statusConfig.variant}
        className={cn(
          'flex items-center gap-1.5',
          sizeClasses[size],
          statusConfig.className
        )}
      >
        <StatusIcon className={cn(iconSizes[size])} />
        <span>{statusConfig.label}</span>
        {hasPendingOperations && (
          <span className="ml-1">
            ({syncState.pendingCount > 0 && `${syncState.pendingCount} pending`}
            {syncState.pendingCount > 0 && syncState.failedCount > 0 && ', '}
            {syncState.failedCount > 0 && `${syncState.failedCount} failed`})
          </span>
        )}
      </Badge>

      {/* Manual Sync Button */}
      {showSyncButton && syncState.isOnline && (
        <Button
          variant="outline"
          size={size === 'sm' ? 'sm' : 'default'}
          onClick={handleSync}
          disabled={isSyncing || (!hasPendingOperations && syncState.status === 'synced')}
          className="gap-1.5"
        >
          {isSyncing ? (
            <>
              <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <RefreshCw className={cn(iconSizes[size])} />
              <span>Sync</span>
            </>
          )}
        </Button>
      )}

      {/* Error Display (if any) */}
      {lastError && (
        <span className={cn('text-xs text-destructive', sizeClasses[size])}>
          {lastError}
        </span>
      )}
    </div>
  );
}

