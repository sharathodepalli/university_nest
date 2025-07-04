import React, { useState } from "react";
import {
  Filter,
  X,
  MapPin,
  DollarSign,
  Home,
  Calendar,
  Settings,
  School,
} from "lucide-react";
import { useListings } from "../contexts/ListingsContext";
import { SearchFilters as SearchFiltersType } from "../types";
import { amenityOptions, roomTypeOptions } from "../data/mockData";

interface SearchFiltersProps {
  className?: string;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ className = "" }) => {
  const { filters, setFilters, universitySuggestions } = useListings();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<SearchFiltersType>(filters);
  const [customUniversity, setCustomUniversity] = useState("");

  const handleUniversityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomUniversity(value);
    // Check if the typed value matches a suggestion
    if (universitySuggestions.includes(value)) {
      handleFilterChange("university", value);
    } else {
      handleFilterChange("university", { custom: value });
    }
  };

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

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof SearchFiltersType];
    return (
      value !== undefined &&
      value !== null &&
      (Array.isArray(value) ? value.length > 0 : true)
    );
  });

  return (
    <div className={`relative ${className}`}>
      {/* Filter Button */}
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
        {hasActiveFilters && (
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
            {Object.keys(filters).length}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute top-12 left-0 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-6 z-50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-6">
            {/* University Filter */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <School className="w-4 h-4" />
                <span>University</span>
              </label>
              <input
                type="text"
                list="university-suggestions"
                placeholder="Type or select a university"
                value={customUniversity}
                onChange={handleUniversityChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <datalist id="university-suggestions">
                {universitySuggestions.map((uni) => (
                  <option key={uni} value={uni} />
                ))}
              </datalist>
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4" />
                <span>Location</span>
              </label>
              <input
                type="text"
                placeholder="City or University"
                value={localFilters.location || ""}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
                {amenityOptions.map((amenity) => (
                  <label key={amenity} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={
                        localFilters.amenities?.includes(amenity) || false
                      }
                      onChange={(e) => {
                        const currentAmenities = localFilters.amenities || [];
                        if (e.target.checked) {
                          handleFilterChange("amenities", [
                            ...currentAmenities,
                            amenity,
                          ]);
                        } else {
                          handleFilterChange(
                            "amenities",
                            currentAmenities.filter((a) => a !== amenity)
                          );
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </label>
                ))}
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
                value={
                  localFilters.availableFrom
                    ? new Date(localFilters.availableFrom)
                        .toISOString()
                        .split("T")[0]
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

export default SearchFilters;
