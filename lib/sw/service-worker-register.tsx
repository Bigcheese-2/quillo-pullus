'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { registerServiceWorker } from './register';
import { processSyncQueue } from '@/lib/services/sync-manager';
import { formatConflictMessage } from '@/lib/services/conflict-resolver';

/**
 * Client component that registers the service worker on mount.
 * This should be included in the root layout.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    registerServiceWorker({
        onUpdateAvailable: () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('New service worker available');
          }
        },
        onInstalled: () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Service worker installed');
          }
        },
        onError: (error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Service worker error:', error);
          }
        },
      });

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', async (event) => {
          if (event.data && event.data.type === 'SYNC_NOTES') {
            const userId = process.env.NEXT_PUBLIC_USER_ID || 'user@example.com';
            try {
              const result = await processSyncQueue(userId);
              if (result.syncedCount > 0 && process.env.NODE_ENV === 'development') {
                console.log(`Background sync completed: ${result.syncedCount} operations synced`);
              }
              if (result.conflicts.length > 0) {
                result.conflicts.forEach((conflict) => {
                  toast.info(formatConflictMessage(conflict), {
                    duration: 5000,
                  });
                });
              }
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.error('Background sync processing failed:', error);
              }
            }
          }
        });
      }

      const handleOnline = async () => {
        const userId = process.env.NEXT_PUBLIC_USER_ID || 'user@example.com';
        try {
          const result = await processSyncQueue(userId);
          if (result.conflicts.length > 0) {
            result.conflicts.forEach((conflict) => {
              toast.info(formatConflictMessage(conflict), {
                duration: 5000,
              });
            });
          }
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Online sync failed:', error);
            }
          }
      };

      window.addEventListener('online', handleOnline);

      return () => {
        window.removeEventListener('online', handleOnline);
      };
  }, []);

  return null;
}

