'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from './register';
import { processSyncQueue } from '@/lib/services/sync-manager';

/**
 * Client component that registers the service worker on mount.
 * This should be included in the root layout.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    // Only register in production (PWA is disabled in dev to avoid Turbopack conflicts)
    if (process.env.NODE_ENV === 'production') {
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

      // Listen for Background Sync events from service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', async (event) => {
          if (event.data && event.data.type === 'SYNC_NOTES') {
            const userId = process.env.NEXT_PUBLIC_USER_ID || 'user@example.com';
            try {
              const syncedCount = await processSyncQueue(userId);
              if (syncedCount > 0 && process.env.NODE_ENV === 'development') {
                console.log(`Background sync completed: ${syncedCount} operations synced`);
              }
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.error('Background sync processing failed:', error);
              }
            }
          }
        });
      }

      // Listen for online events to trigger sync
      const handleOnline = async () => {
        const userId = process.env.NEXT_PUBLIC_USER_ID || 'user@example.com';
        try {
          await processSyncQueue(userId);
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
    }
  }, []);

  return null;
}

