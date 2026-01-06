'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';


interface OfflineIndicatorProps {

  className?: string;
  
  position?: 'top' | 'bottom';
}


export function OfflineIndicator({ 
  className,
  position = 'top',
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => setShow(false), 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShow(true);
    };

    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
      setShow(!navigator.onLine);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!show) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50 bg-yellow-500 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100',
        'px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium',
        'transition-transform duration-300 ease-in-out',
        position === 'top' 
          ? 'top-0 translate-y-0' 
          : 'bottom-0 translate-y-0',
        !show && (position === 'top' ? '-translate-y-full' : 'translate-y-full'),
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Back online. Syncing changes...</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>You&apos;re offline. Changes are saved locally and will sync when you&apos;re back online.</span>
        </>
      )}
    </div>
  );
}

