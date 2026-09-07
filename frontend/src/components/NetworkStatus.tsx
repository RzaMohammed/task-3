import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 z-50 flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium shadow-xl border backdrop-blur-md transition-all duration-300 ${
        isOnline
          ? 'bg-[#062e1a]/90 text-[#06d6a0] border-[#06d6a0]/40 animate-fade-in'
          : 'bg-[#1b0808]/90 text-[#ef4444] border-[#ef4444]/40 animate-pulse'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-3.5 h-3.5 text-[#06d6a0]" />
          <span>Connection restored to network</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5 text-[#ef4444]" />
          <span>Offline — check internet or local proxy</span>
        </>
      )}
    </div>
  );
};
