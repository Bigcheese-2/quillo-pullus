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
      const initialOnline = navigator.onLine;
      setIsOnline(initialOnline);
      setShow(!initialOnline);
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
        'w-[98%] md:w-5/6 lg:w-1/2 bg-yellow-500 rounded-lg mx-auto dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100',
        'px-4  flex items-center justify-center gap-2 py-3 text-sm font-medium',
        'transition-all duration-300 ease-in-out',
        show ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden',
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
          <span  className='text-xs md:text-base'>You&apos;re offline. Changes are saved locally and will sync when you&apos;re back online.</span>
        </>
      )}
    </div>
  );
}

