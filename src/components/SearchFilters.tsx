import React, { useState } from "react";
import {
  X,
  MapPin,
  DollarSign,
  Home,
  Calendar,
  School,
  Sparkles,
} from "lucide-react";
import { useListings } from "../contexts/ListingsContext";
import { SearchFilters as SearchFiltersType } from "../types"; // Import SearchFiltersType
import { amenityOptions, roomTypeOptions } from "../data/mockData";

interface SearchFiltersProps {
  className?: string;
  onClose: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  className = "",
  onClose,
}) => {
  const { filters, setFilters, universitySuggestions } = useListings();
  const [localFilters, setLocalFilters] = useState<SearchFiltersType>(filters);
  const [customUniversity, setCustomUniversity] = useState(
    typeof filters.university === "object" && filters.university.custom
      ? filters.university.custom
      : ""
  );

  const handleUniversityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomUniversity(value);
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
    onClose();
  };

  const clearFilters = () => {
    const emptyFilters: SearchFiltersType = {};
    setLocalFilters(emptyFilters);
    setFilters(emptyFilters);
    setCustomUniversity("");
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full"
          aria-label="Close filters"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* University Filter */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <School className="w-4 h-4" />
            <span>University</span>
          </label>
          <input
            type="text"
            list="university-suggestions"
            placeholder="Type or select university"
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
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <MapPin className="w-4 h-4" />
            <span>Location</span>
          </label>
          <input
            type="text"
            placeholder="City, address, or zip code"
            value={localFilters.location || ""}
            onChange={(e) => handleFilterChange("location", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
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
                  min: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max"
              value={localFilters.priceRange?.max || ""}
              onChange={(e) =>
                handleFilterChange("priceRange", {
                  ...localFilters.priceRange,
                  max: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Room Type */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Home className="w-4 h-4" />
            <span>Room Type</span>
          </label>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {roomTypeOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={
                    localFilters.roomType?.includes(option.value) || false
                  }
                  onChange={(e) => {
                    const currentTypes = localFilters.roomType || [];
                    const newTypes = e.target.checked
                      ? [...currentTypes, option.value]
                      : currentTypes.filter((t) => t !== option.value);
                    handleFilterChange("roomType", newTypes);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Sparkles className="w-4 h-4" />
            <span>Amenities</span>
          </label>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {amenityOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={
                    localFilters.amenities?.includes(option.value) || false
                  }
                  onChange={(e) => {
                    const currentAmenities = localFilters.amenities || [];
                    const newAmenities = e.target.checked
                      ? [...currentAmenities, option.value]
                      : currentAmenities.filter((a) => a !== option.value);
                    handleFilterChange("amenities", newAmenities);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Move-in Date */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4" />
            <span>Move-in Date</span>
          </label>
          <input
            type="date"
            // Ensure the value is a string in 'YYYY-MM-DD' format for HTML date input
            value={localFilters.moveInDate || ""}
            onChange={(e) => handleFilterChange("moveInDate", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200">
        <button
          onClick={clearFilters}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Clear all
        </button>
        <button
          onClick={applyFilters}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;
