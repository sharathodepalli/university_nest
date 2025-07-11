import { useEffect, useCallback, useRef } from 'react';

interface UseTabVisibilityOptions {
  onVisible?: () => void;
  onHidden?: () => void;
  onFocus?: () => void;
  refreshDelay?: number;
}

/**
 * Hook to handle tab visibility changes and focus events
 * Useful for refreshing data when user returns to the tab
 */
export function useTabVisibility({
  onVisible,
  onHidden,
  onFocus,
  refreshDelay = 1000
}: UseTabVisibilityOptions = {}) {
  const lastHiddenTime = useRef<number | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Tab became hidden
      lastHiddenTime.current = Date.now();
      onHidden?.();
    } else {
      // Tab became visible
      const hiddenDuration = lastHiddenTime.current 
        ? Date.now() - lastHiddenTime.current 
        : 0;

      console.log(`[TabVisibility] Tab visible after ${hiddenDuration}ms`);
      
      // Only refresh if tab was hidden for more than 5 seconds
      if (hiddenDuration > 5000) {
        // Clear any existing timeout
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }

        // Delay refresh to avoid rapid successive calls
        refreshTimeoutRef.current = setTimeout(() => {
          console.log('[TabVisibility] Refreshing data after tab became visible');
          onVisible?.();
        }, refreshDelay);
      } else {
        onVisible?.();
      }
    }
  }, [onVisible, onHidden, refreshDelay]);

  const handleFocus = useCallback(() => {
    console.log('[TabVisibility] Window focused');
    onFocus?.();
  }, [onFocus]);

  useEffect(() => {
    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [handleVisibilityChange, handleFocus]);

  return {
    isVisible: !document.hidden,
    lastHiddenTime: lastHiddenTime.current
  };
}
