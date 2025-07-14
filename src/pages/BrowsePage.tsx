import React, { useState, useMemo, useEffect, useCallback } from "react";
import ListingCard from "../components/ListingCard";
import SkeletonCard from "../components/SkeletonCard";
import EmptyState from "../components/EmptyState";
import SearchFilters from "../components/SearchFilters"; // Import the SearchFilters component
import { useAuth } from "../contexts/AuthContext";
import { errorHandler } from "../lib/errorHandler";
import { useListings } from "../contexts/ListingsContext";
import {
  Grid,
  List,
  SlidersHorizontal,
  Target,
  MapPin,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { amenityOptions, roomTypeOptions } from "../data/mockData";
import { SearchFilters as SearchFiltersType } from "../types";

const BrowsePage: React.FC = () => {
  const { user } = useAuth();
  const {
    filteredListings,
    recommendedListings,
    isLoading,
    error,
    filters,
    setFilters,
    sortBy,
    setSortBy,
  } = useListings();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showRecommended, setShowRecommended] = useState(true);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [openQuickFilter, setOpenQuickFilter] = useState<string | null>(null);

  const navigate = useNavigate();

  const displayListings = useMemo(() => {
    if (showRecommended && user && recommendedListings.length > 0) {
      return recommendedListings;
    }
    return filteredListings;
  }, [showRecommended, user, recommendedListings, filteredListings]);

  const handleListingClick = (listingId: string) => {
    try {
      navigate(`/listing/${listingId}`);
    } catch (error) {
      errorHandler.logError(new Error(`Navigation error: ${error}`));
    }
  };

  const getUniversityDisplayName = () => {
    if (!user?.university) return "Students";

    if (
      user.university === "Unknown University" ||
      user.university === "Unknown"
    ) {
      return "Students";
    }

    return `${user.university} Students`;
  };

  const handleQuickFilterChange = useCallback(
    <K extends keyof SearchFiltersType>(
      key: K,
      value: SearchFiltersType[K]
    ) => {
      setFilters({
        ...filters,
        [key]: value,
      });
    },
    [filters, setFilters]
  );

  const handlePriceRangeQuickFilter = (min: number, max: number) => {
    handleQuickFilterChange("priceRange", { min, max });
    setOpenQuickFilter(null); // Close after selection
  };

  const handleRoomTypeQuickFilter = (type: string) => {
    const currentTypes = filters.roomType || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    handleQuickFilterChange(
      "roomType",
      newTypes.length > 0 ? newTypes : undefined
    );
    // Do not close immediately, allow multiple selections
  };

  const handleAmenityQuickFilter = (amenity: string) => {
    const currentAmenities = filters.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity];
    handleQuickFilterChange(
      "amenities",
      newAmenities.length > 0 ? newAmenities : undefined
    );
    // Do not close immediately, allow multiple selections
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openQuickFilter &&
        !(event.target as HTMLElement).closest(".quick-filter-dropdown")
      ) {
        setOpenQuickFilter(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openQuickFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>

          {user && (
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-8">
            <div className="h-10 w-28 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-10 w-28 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-10 w-28 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-10 w-28 bg-gray-200 rounded-full animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Unable to load listings
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user
              ? `Housing for ${getUniversityDisplayName()}`
              : "Browse Student Housing"}
          </h1>
          <p className="text-gray-600">
            {showRecommended && user && recommendedListings.length > 0
              ? `${recommendedListings.length} personalized recommendations`
              : `${filteredListings.length} available listings`}
          </p>
        </div>

        {/* Verification Prompt for Unverified Users */}
        {user &&
          !user.student_verified &&
          user.verification_status !== "verified" && (
            <div className="verification-banner mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Unlock Premium Features
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Get verified to access exclusive listings, message hosts who
                    only accept verified students, and gain trust within the
                    UniNest community.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate("/verification")}
                      className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                    >
                      Get Verified Now
                    </button>
                    <button
                      onClick={() => {
                        const banner = document.querySelector(
                          ".verification-banner"
                        );
                        if (banner) banner.remove();
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Smart Recommendations Toggle */}
        {user && recommendedListings.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowRecommended(true)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  showRecommended
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
                aria-pressed={showRecommended}
              >
                <Target className="w-4 h-4" />
                <span>Recommended for You</span>
              </button>

              <button
                onClick={() => setShowRecommended(false)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  !showRecommended
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
                aria-pressed={!showRecommended}
              >
                <TrendingUp className="w-4 h-4" />
                <span>All Listings</span>
              </button>
            </div>
          </div>
        )}

        {/* Filters and Controls (Airbnb-like) */}
        <div className="flex flex-wrap items-center gap-3 mb-6 relative z-10">
          {/* Filter Button to open full panel */}
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-all duration-200 ${
              showFiltersPanel
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
            aria-expanded={showFiltersPanel}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
            {/* Display active filter count if needed, similar to SmartFilters */}
          </button>

          {/* Quick Filter: Price */}
          <div className="relative quick-filter-dropdown">
            <button
              onClick={() =>
                setOpenQuickFilter(openQuickFilter === "price" ? null : "price")
              }
              className={`flex items-center space-x-1 px-4 py-2 rounded-full border transition-colors ${
                filters.priceRange?.min || filters.priceRange?.max
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className="text-sm font-medium">Price</span>
              {openQuickFilter === "price" ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {openQuickFilter === "price" && (
              <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">
                  Price Range
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      checked={
                        !filters.priceRange?.min && !filters.priceRange?.max
                      }
                      onChange={() =>
                        handleQuickFilterChange("priceRange", undefined)
                      }
                      className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Any Price</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      checked={filters.priceRange?.max === 800}
                      onChange={() => handlePriceRangeQuickFilter(0, 800)}
                      className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Under $800</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      checked={
                        filters.priceRange?.min === 800 &&
                        filters.priceRange?.max === 1200
                      }
                      onChange={() => handlePriceRangeQuickFilter(800, 1200)}
                      className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>$800 - $1200</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      checked={
                        filters.priceRange?.min === 1200 &&
                        filters.priceRange?.max === 1800
                      }
                      onChange={() => handlePriceRangeQuickFilter(1200, 1800)}
                      className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>$1200 - $1800</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      checked={
                        filters.priceRange?.min === 1800 &&
                        filters.priceRange?.max === 2500
                      }
                      onChange={() => handlePriceRangeQuickFilter(1800, 2500)}
                      className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>$1800 - $2500</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      checked={
                        filters.priceRange?.min === 2500 &&
                        filters.priceRange?.max === 10000
                      }
                      onChange={() => handlePriceRangeQuickFilter(2500, 10000)}
                      className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>$2500+</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Quick Filter: Room Type */}
          <div className="relative quick-filter-dropdown">
            <button
              onClick={() =>
                setOpenQuickFilter(
                  openQuickFilter === "roomType" ? null : "roomType"
                )
              }
              className={`flex items-center space-x-1 px-4 py-2 rounded-full border transition-colors ${
                filters.roomType && filters.roomType.length > 0
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className="text-sm font-medium">Room Type</span>
              {openQuickFilter === "roomType" ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {openQuickFilter === "roomType" && (
              <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">
                  Select Room Types
                </h4>
                <div className="space-y-2">
                  {roomTypeOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          filters.roomType?.includes(option.value) || false
                        }
                        onChange={() => handleRoomTypeQuickFilter(option.value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Filter: Amenities */}
          <div className="relative quick-filter-dropdown">
            <button
              onClick={() =>
                setOpenQuickFilter(
                  openQuickFilter === "amenities" ? null : "amenities"
                )
              }
              className={`flex items-center space-x-1 px-4 py-2 rounded-full border transition-colors ${
                filters.amenities && filters.amenities.length > 0
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className="text-sm font-medium">Amenities</span>
              {openQuickFilter === "amenities" ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {openQuickFilter === "amenities" && (
              <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 max-h-60 overflow-y-auto">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">
                  Select Amenities
                </h4>
                <div className="space-y-2">
                  {amenityOptions.map(
                    (
                      option // Correctly map 'option' which is an object
                    ) => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={
                            filters.amenities?.includes(option.value) || false
                          }
                          onChange={() =>
                            handleAmenityQuickFilter(option.value)
                          } // Pass option.value
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{option.label}</span> {/* Display option.label */}
                      </label>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="relevance">Best Match</option>
              <option value="match">Compatibility</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="distance">Distance</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showFiltersPanel && (
          <div className="mb-8">
            <SearchFilters onClose={() => setShowFiltersPanel(false)} />
          </div>
        )}

        {displayListings.length === 0 ? (
          <EmptyState
            title={
              import.meta.env.PROD
                ? "No listings available yet"
                : "No listings found"
            }
            description={
              import.meta.env.PROD
                ? "Be the first to create a listing and help build our community! Start by posting your room or finding roommates."
                : user
                ? "Try adjusting your filters: increase distance, expand budget range, consider different room types, or remove amenity requirements."
                : "Adjust your search criteria or sign up to see personalized recommendations."
            }
            action={{
              label: "Post a Listing",
              onClick: () => navigate("/create-listing"),
            }}
            icon={<MapPin className="w-12 h-12 text-gray-400" />}
          />
        ) : (
          <>
            {showRecommended && user && recommendedListings.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Target className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">
                      Personalized Recommendations
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      These listings are specially selected based on your
                      university ({user.university}), preferences, and budget.
                      Match scores show compatibility.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              }`}
              role="grid"
              aria-label="Listings"
            >
              {displayListings.map((listing) => (
                <div key={listing.id} role="gridcell">
                  <ListingCard
                    listing={listing}
                    onClick={() => handleListingClick(listing.id)}
                    showMatchScore={!!user}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(BrowsePage);
