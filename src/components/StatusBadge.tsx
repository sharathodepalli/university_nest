import React from "react";
import { Check, Clock, X } from "lucide-react";
import { Listing } from "../types";

interface StatusBadgeProps {
  status: Listing["status"];
  size?: "sm" | "md" | "lg";
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "sm",
  className = "",
}) => {
  const getStatusConfig = (status: Listing["status"]) => {
    switch (status) {
      case "active":
        return {
          label: "Available",
          color: "bg-green-100 text-green-800 border-green-200",
          icon: (
            <Check
              className={`${size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"}`}
            />
          ),
        };
      case "rented":
        return {
          label: "Rented",
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: (
            <Clock
              className={`${size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"}`}
            />
          ),
        };
      case "inactive":
        return {
          label: "Inactive",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: (
            <X
              className={`${size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"}`}
            />
          ),
        };
      default:
        return {
          label: "Unknown",
          color: "bg-red-100 text-red-800 border-red-200",
          icon: (
            <X
              className={`${size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"}`}
            />
          ),
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-xs"
      : size === "md"
        ? "px-2.5 py-1 text-sm"
        : "px-3 py-1.5 text-base";

  return (
    <span
      className={`inline-flex items-center space-x-1 rounded-full border font-medium ${config.color} ${sizeClasses} ${className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
