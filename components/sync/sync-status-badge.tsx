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


interface SyncStatusBadgeProps {
  
  className?: string;
  
  /**
   * Whether to show operation counts.
   * @default true
   */
  showCounts?: boolean;
}


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
        className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
      };
    }

    switch (syncState.status) {
      case 'synced':
        return {
          icon: CheckCircle2,
          label: 'up to date',
          variant: 'default' as const,
          className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700',
        };
      case 'syncing':
        return {
          icon: Loader2,
          label: 'Syncing...',
          variant: 'secondary' as const,
          className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700',
        };
      case 'pending':
        return {
          icon: Clock,
          label: syncState.pendingCount > 0 ? `${syncState.pendingCount} Pending` : 'Pending',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
        };
      case 'failed':
        return {
          icon: AlertCircle,
          label: syncState.failedCount > 0 ? `${syncState.failedCount} Failed` : 'Failed',
          variant: 'destructive' as const,
          className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
        };
      default:
        return {
          icon: CheckCircle2,
          label: 'Unknown',
          variant: 'outline' as const,
          className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const hasPendingOperations = syncState.pendingCount > 0 || syncState.failedCount > 0;

  const iconClassName = statusConfig.className.includes('animate-spin') 
    ? 'h-3.5 w-3.5' 
    : 'h-3.5 w-3.5';

  return (
    <Badge 
      variant={statusConfig.variant}
      className={cn(
        'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1',
        'border',
        statusConfig.className,
        className
      )}
    >
      <StatusIcon className={iconClassName} />
      <span className='text-xs'>{statusConfig.label}</span>
    </Badge>
  );
}

