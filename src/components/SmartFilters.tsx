import React, { useState } from "react";
import {
  Filter,
  X,
  MapPin,
  DollarSign,
  Home,
  Calendar,
  Settings,
  Target,
  CaseSensitive as UniversityIcon,
} from "lucide-react"; // Removed Users import
import { useListings } from "../contexts/ListingsContext";
import { useAuth } from "../contexts/AuthContext";
import { SearchFilters as SearchFiltersType } from "../types";
import { amenityOptions, roomTypeOptions } from "../data/mockData";
import { universityData } from "../data/universities";

interface SmartFiltersProps {
  className?: string;
}

const SmartFilters: React.FC<SmartFiltersProps> = ({ className = "" }) => {
  const { user } = useAuth();
  const { filters, setFilters, sortBy, setSortBy } = useListings();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<SearchFiltersType>(filters);

  const handleFilterChange = (key: keyof SearchFiltersType, value: any) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    setFilters(localFilters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters: SearchFiltersType = {};
    setLocalFilters(emptyFilters);
    setFilters(emptyFilters);
  };

  const applySmartFilters = (type: "budget" | "university" | "nearby") => {
    const smartFilters: SearchFiltersType = { ...localFilters };

    switch (type) {
      case "budget":
        if (user?.preferences?.maxBudget) {
          smartFilters.priceRange = {
            min: 0,
            max: user.preferences.maxBudget,
          };
        }
        break;
      case "university":
        if (user?.university) {
          smartFilters.university = user.university;
        }
        break;
      case "nearby":
        if (user?.matchingPreferences?.maxDistance) {
          smartFilters.maxDistance = user.matchingPreferences.maxDistance;
        } else {
          smartFilters.maxDistance = 10; // Default 10 miles
        }
        break;
    }

    setLocalFilters(smartFilters);
    setFilters(smartFilters);
    setIsOpen(false);
  };

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof SearchFiltersType];
    return (
      value !== undefined &&
      value !== null &&
      (Array.isArray(value) ? value.length > 0 : true)
    );
  });

  const activeFilterCount = Object.keys(filters).filter((key) => {
    const value = filters[key as keyof SearchFiltersType];
    return (
      value !== undefined &&
      value !== null &&
      (Array.isArray(value) ? value.length > 0 : true)
    );
  }).length;

  return (
    <div className={`relative ${className}`}>
      {/* Filter Controls */}
      <div className="flex items-center space-x-3">
        {/* Smart Filter Buttons */}
        {user && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => applySmartFilters("university")}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <UniversityIcon className="w-4 h-4" />
              <span>My University</span>
            </button>

            <button
              onClick={() => applySmartFilters("nearby")}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Target className="w-4 h-4" />
              <span>Nearby</span>
            </button>

            {user.preferences?.maxBudget && (
              <button
                onClick={() => applySmartFilters("budget")}
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                <span>My Budget</span>
              </button>
            )}
          </div>
        )}

        {/* Main Filter Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
            hasActiveFilters
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="relevance">Best Match</option>
          <option value="match">Compatibility</option>
          <option value="price-asc">Price: Low to High</option>{" "}
          {/* Corrected value */}
          <option value="price-desc">Price: High to Low</option>{" "}
          {/* Corrected value */}
          <option value="distance">Distance</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute top-12 left-0 w-96 bg-white rounded-xl shadow-xl border border-gray-200 p-6 z-50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Advanced Filters
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Location & University */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4" />
                <span>Location</span>
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="City or Area"
                  value={localFilters.location || ""}
                  onChange={(e) =>
                    handleFilterChange("location", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <select
                  // CORRECTED: Conditionally set value based on type of localFilters.university
                  value={
                    typeof localFilters.university === "object"
                      ? localFilters.university.custom
                      : localFilters.university || ""
                  }
                  onChange={(e) =>
                    handleFilterChange("university", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any University</option>
                  {universityData.map((uni) => (
                    <option key={uni.id} value={uni.name}>
                      {uni.name}
                    </option>
                  ))}
                </select>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Max Distance: {localFilters.maxDistance || 25} miles
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={localFilters.maxDistance || 25}
                    onChange={(e) =>
                      handleFilterChange("maxDistance", Number(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4" />
                <span>Price Range</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={localFilters.priceRange?.min || ""}
                  onChange={(e) =>
                    handleFilterChange("priceRange", {
                      ...localFilters.priceRange,
                      min: Number(e.target.value),
                    })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={localFilters.priceRange?.max || ""}
                  onChange={(e) =>
                    handleFilterChange("priceRange", {
                      ...localFilters.priceRange,
                      max: Number(e.target.value),
                    })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Room Type */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Home className="w-4 h-4" />
                <span>Room Type</span>
              </label>
              <div className="space-y-2">
                {roomTypeOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={
                        localFilters.roomType?.includes(option.value) || false
                      }
                      onChange={(e) => {
                        const currentTypes = localFilters.roomType || [];
                        if (e.target.checked) {
                          handleFilterChange("roomType", [
                            ...currentTypes,
                            option.value,
                          ]);
                        } else {
                          handleFilterChange(
                            "roomType",
                            currentTypes.filter((t) => t !== option.value)
                          );
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Settings className="w-4 h-4" />
                <span>Amenities</span>
              </label>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {amenityOptions.map(
                  (
                    option // Changed from 'amenity' to 'option' for consistency with type
                  ) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-2"
                    >
                      {" "}
                      {/* Use option.value */}
                      <input
                        type="checkbox"
                        checked={
                          localFilters.amenities?.includes(option.value) ||
                          false
                        } // Use option.value
                        onChange={(e) => {
                          const currentAmenities = localFilters.amenities || [];
                          if (e.target.checked) {
                            handleFilterChange("amenities", [
                              ...currentAmenities,
                              option.value,
                            ]); // Use option.value
                          } else {
                            handleFilterChange(
                              "amenities",
                              currentAmenities.filter((a) => a !== option.value)
                            ); // Use option.value
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {option.label}
                      </span>{" "}
                      {/* Use option.label */}
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Available From */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                <span>Available From</span>
              </label>
              <input
                type="date"
                // The value for type="date" must be YYYY-MM-DD
                value={
                  localFilters.availableFrom instanceof Date
                    ? localFilters.availableFrom.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  handleFilterChange(
                    "availableFrom",
                    e.target.value ? new Date(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Move-in Date */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                <span>Move-in Date</span>
              </label>
              <input
                type="date"
                value={localFilters.moveInDate || ""}
                onChange={(e) =>
                  handleFilterChange("moveInDate", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={applyFilters}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartFilters;
