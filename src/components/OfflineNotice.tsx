import React from "react";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../utils/useOnlineStatus";

const OfflineNotice: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="bg-yellow-500 text-white p-2 text-center text-sm flex items-center justify-center space-x-2">
      <WifiOff className="w-4 h-4" />
      <span>
        You are currently offline. Some features may not be available.
      </span>
    </div>
  );
};

export default OfflineNotice;
