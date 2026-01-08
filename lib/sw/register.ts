
interface ServiceWorkerCallbacks {
  onUpdateAvailable?: () => void;
  onInstalled?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Registers the service worker with optional callbacks.
 * 
 * @param callbacks - Optional callbacks for service worker events
 * @returns Promise resolving when registration is complete
 */
export async function registerServiceWorker(
  callbacks?: ServiceWorkerCallbacks
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  if (!window.isSecureContext) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          callbacks?.onUpdateAvailable?.();
        } else if (newWorker.state === 'installed') {
          callbacks?.onInstalled?.();
        }
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    return registration;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    callbacks?.onError?.(err);
    return null;
  }
}

/**
 * Unregisters all service workers.
 * 
 * @returns Promise resolving when unregistration is complete
 */
export async function unregisterServiceWorkers(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch (error) {
  }
}

/**
 * Checks if a service worker is currently controlling the page.
 * 
 * @returns true if a service worker is controlling the page
 */
export function isServiceWorkerControlling(): boolean {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  return !!navigator.serviceWorker.controller;
}

/**
 * Gets the current service worker registration.
 * 
 * @returns Promise resolving to the registration, or null if not found
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    return null;
  }
}

