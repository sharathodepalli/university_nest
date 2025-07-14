import React from "react";
import { shouldShowDevIndicators } from "../config/dataConfig";

interface DevIndicatorProps {
  message?: string;
  type?: "mock-data" | "offline" | "development";
}

const DevIndicator: React.FC<DevIndicatorProps> = ({
  message = "Development Mode - Mock Data",
  type = "mock-data",
}) => {
  if (!shouldShowDevIndicators()) {
    return null;
  }

  const getStyles = () => {
    switch (type) {
      case "mock-data":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "offline":
        return "bg-red-50 text-red-800 border-red-200";
      default:
        return "bg-blue-50 text-blue-800 border-blue-200";
    }
  };

  return (
    <div
      className={`fixed top-4 left-4 z-50 px-3 py-2 rounded-md text-sm font-medium border ${getStyles()}`}
    >
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default DevIndicator;
