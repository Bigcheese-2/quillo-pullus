/**
 * Service Worker Registration Utility
 * 
 * Handles service worker registration and lifecycle events.
 * Provides callbacks for service worker updates and installation.
 */

/**
 * Callbacks for service worker events
 */
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
  // Check if service workers are supported
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Service workers are not supported in this browser');
    }
    return null;
  }

  if (!window.isSecureContext) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Service workers require a secure context (HTTPS or localhost)');
    }
    return null;
  }

  try {
    // Register the service worker
    // next-pwa generates the service worker at /sw.js
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Handle service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker is available
          callbacks?.onUpdateAvailable?.();
        } else if (newWorker.state === 'installed') {
          // Service worker installed for the first time
          callbacks?.onInstalled?.();
        }
      });
    });

    // Listen for controller changes (when a new service worker takes control)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Reload the page to use the new service worker
      window.location.reload();
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Service worker registered successfully');
    }
    return registration;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    if (process.env.NODE_ENV === 'development') {
      console.error('Service worker registration failed:', err);
    }
    callbacks?.onError?.(err);
    return null;
  }
}

/**
 * Unregisters all service workers.
 * Useful for development or debugging.
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
    if (process.env.NODE_ENV === 'development') {
      console.log('Service workers unregistered');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to unregister service workers:', error);
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to get service worker registration:', error);
    }
    return null;
  }
}

