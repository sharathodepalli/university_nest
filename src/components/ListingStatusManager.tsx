import React, { useState } from "react";
import { Check, X, AlertCircle, Clock } from "lucide-react";
import { Listing } from "../types";

interface ListingStatusManagerProps {
  listing: Listing;
  onStatusUpdate: (newStatus: Listing["status"]) => Promise<void>;
  isLoading?: boolean;
}

const ListingStatusManager: React.FC<ListingStatusManagerProps> = ({
  listing,
  onStatusUpdate,
  isLoading = false,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: Listing["status"]) => {
    if (isUpdating || isLoading) return;

    setIsUpdating(true);
    try {
      await onStatusUpdate(newStatus);
    } catch (error) {
      console.error("Failed to update listing status:", error);
      alert("Failed to update listing status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusInfo = (status: Listing["status"]) => {
    switch (status) {
      case "active":
        return {
          label: "Available",
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <Check className="w-4 h-4" />,
          description: "Your listing is live and visible to potential tenants",
        };
      case "rented":
        return {
          label: "Rented",
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <Clock className="w-4 h-4" />,
          description: "Room has been rented and is no longer available",
        };
      case "inactive":
        return {
          label: "Inactive",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <X className="w-4 h-4" />,
          description: "Listing is hidden from search results",
        };
      default:
        return {
          label: "Unknown",
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <AlertCircle className="w-4 h-4" />,
          description: "Unknown status",
        };
    }
  };

  const currentStatus = getStatusInfo(listing.status);
  const isActive = listing.status === "active";
  const isRented = listing.status === "rented";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Listing Status</h3>
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${currentStatus.color}`}
        >
          {currentStatus.icon}
          <span className="ml-1">{currentStatus.label}</span>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-6">{currentStatus.description}</p>

      <div className="space-y-3">
        {/* Mark as Rented Button */}
        {isActive && (
          <button
            onClick={() => handleStatusChange("rented")}
            disabled={isUpdating}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span>{isUpdating ? "Updating..." : "Mark as Rented"}</span>
          </button>
        )}

        {/* Mark as Available Button */}
        {(isRented || listing.status === "inactive") && (
          <button
            onClick={() => handleStatusChange("active")}
            disabled={isUpdating}
            className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>{isUpdating ? "Updating..." : "Mark as Available"}</span>
          </button>
        )}

        {/* Deactivate/Activate Button */}
        {isActive && (
          <button
            onClick={() => handleStatusChange("inactive")}
            disabled={isUpdating}
            className="w-full flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <X className="w-4 h-4" />
            <span>{isUpdating ? "Updating..." : "Deactivate Listing"}</span>
          </button>
        )}

        {listing.status === "inactive" && (
          <button
            onClick={() => handleStatusChange("active")}
            disabled={isUpdating}
            className="w-full flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>{isUpdating ? "Updating..." : "Reactivate Listing"}</span>
          </button>
        )}
      </div>

      {/* Status Change Confirmation */}
      {isRented && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Listing marked as rented</p>
              <p className="mt-1">
                Your listing is no longer visible in search results. You can
                reactivate it anytime if it becomes available again.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingStatusManager;
