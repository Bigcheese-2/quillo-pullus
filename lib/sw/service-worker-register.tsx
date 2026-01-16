'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { registerServiceWorker } from './register';
import { processSyncQueue } from '@/lib/services/sync-manager';
import { formatConflictMessage } from '@/lib/services/conflict-resolver';
import { getUserId } from '@/lib/config/env';


export function ServiceWorkerRegister() {
  useEffect(() => {
    let messageListener: ((event: MessageEvent) => void) | null = null;
    let onlineHandler: (() => void) | null = null;
    let offlineHandler: (() => void) | null = null;

    const initServiceWorker = async () => {
      await registerServiceWorker({
        onUpdateAvailable: () => {
        },
        onInstalled: () => {
        },
        onError: (error) => {
        },
      });

      if ('serviceWorker' in navigator) {
        messageListener = async (event: MessageEvent) => {
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
        };
        navigator.serviceWorker.addEventListener('message', messageListener);
      }

      onlineHandler = async () => {
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

      offlineHandler = () => {
      };

      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', offlineHandler);
    };

    initServiceWorker().catch(() => {
    });

    return () => {
      if (messageListener && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', messageListener);
      }
      if (onlineHandler) {
        window.removeEventListener('online', onlineHandler);
      }
      if (offlineHandler) {
        window.removeEventListener('offline', offlineHandler);
      }
    };
  }, []);

  return null;
}

