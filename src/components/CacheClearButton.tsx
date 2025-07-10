import React from "react";
import { useAuth } from "../contexts/AuthContext";

interface CacheClearButtonProps {
  className?: string;
  text?: string;
}

/**
 * Button component to clear all caches and refresh user data
 * Use this when users report stale verification data or caching issues
 */
export const CacheClearButton: React.FC<CacheClearButtonProps> = ({
  className = "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors",
  text = "🧹 Clear Cache & Refresh",
}) => {
  const { clearCachesAndRefresh } = useAuth();
  const [isClearing, setIsClearing] = React.useState(false);

  const handleClearCaches = async () => {
    try {
      setIsClearing(true);
      await clearCachesAndRefresh();

      // Show success message briefly
      setTimeout(() => {
        setIsClearing(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to clear caches:", error);
      setIsClearing(false);
    }
  };

  return (
    <button
      onClick={handleClearCaches}
      disabled={isClearing}
      className={className}
      title="Clear all cached data and refresh user information"
    >
      {isClearing ? "🔄 Clearing..." : text}
    </button>
  );
};

export default CacheClearButton;
