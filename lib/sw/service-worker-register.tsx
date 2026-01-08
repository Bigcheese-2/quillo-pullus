'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { registerServiceWorker } from './register';
import { processSyncQueue } from '@/lib/services/sync-manager';
import { formatConflictMessage } from '@/lib/services/conflict-resolver';
import { getUserId } from '@/lib/config/env';

/**
 * Client component that registers the service worker on mount.
 * This should be included in the root layout.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    registerServiceWorker({
        onUpdateAvailable: () => {
        },
        onInstalled: () => {
        },
        onError: (error) => {
        },
      });

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', async (event) => {
          if (event.data && event.data.type === 'SYNC_NOTES') {
            const userId = getUserId();
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
            }
          }
        });
      }

      const handleOnline = async () => {
        const userId = getUserId();
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
          }
      };

      window.addEventListener('online', handleOnline);

      return () => {
        window.removeEventListener('online', handleOnline);
      };
  }, []);

  return null;
}

