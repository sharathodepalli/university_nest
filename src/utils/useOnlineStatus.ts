import { useState, useEffect } from 'react';

/**
 * Custom React Hook to track the browser's online/offline status.
 * Returns true if the browser is online, false otherwise.
 */
export function useOnlineStatus(): boolean {
  // Initialize state with the current online status of the browser
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Event handler for when the browser comes online
    const handleOnline = () => {
      setIsOnline(true);
      console.log("[useOnlineStatus] Browser is online.");
    };

    // Event handler for when the browser goes offline
    const handleOffline = () => {
      setIsOnline(false);
      console.warn("[useOnlineStatus] Browser is offline.");
    };

    // Add event listeners for 'online' and 'offline' events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup function: remove event listeners when the component unmounts
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  return isOnline;
}