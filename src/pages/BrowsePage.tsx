import React, { useState, useEffect, useMemo } from 'react';
import { Grid, List, MapPin, SlidersHorizontal, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import SkeletonCard from '../components/SkeletonCard';
import LoadingSpinner from '../components/LoadingSpinner';
import SmartFilters from '../components/SmartFilters';
import { useListings } from '../contexts/ListingsContext';
import { useAuth } from '../contexts/AuthContext';
import { errorHandler } from '../lib/errorHandler';

const BrowsePage: React.FC = () => {
  const { user } = useAuth();
  const { filteredListings, recommendedListings, isLoading, error } = useListings();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showRecommended, setShowRecommended] = useState(true);
  const navigate = useNavigate();

  // Memoized display listings to prevent unnecessary recalculations
  const displayListings = useMemo(() => {
    if (showRecommended && user && recommendedListings.length > 0) {
      return recommendedListings;
    }
    return filteredListings;
  }, [showRecommended, user, recommendedListings, filteredListings]);

  // Handle navigation with error boundary
  const handleListingClick = (listingId: string) => {
    try {
      navigate(`/listing/${listingId}`);
    } catch (error) {
      errorHandler.logError(new Error(`Navigation error: ${error}`));
    }
  };

  // Get university name for display
  const getUniversityDisplayName = () => {
    if (!user?.university) return 'Students';
    
    // Handle "Unknown University" case
    if (user.university === 'Unknown University' || user.university === 'Unknown') {
      return 'Students';
    }
    
    return `${user.university} Students`;
  };

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>

          {/* Smart Recommendations Toggle Skeleton */}
          {user && (
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Filters Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-28 animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
            </div>
          </div>

          {/* Listings Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
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
            {user ? `Housing for ${getUniversityDisplayName()}` : 'Browse Student Housing'}
          </h1>
          <p className="text-gray-600">
            {showRecommended && user && recommendedListings.length > 0
              ? `${recommendedListings.length} personalized recommendations`
              : `${filteredListings.length} available listings`
            }
          </p>
        </div>

        {/* Smart Recommendations Toggle */}
        {user && recommendedListings.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowRecommended(true)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  showRecommended
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                aria-pressed={!showRecommended}
              >
                <TrendingUp className="w-4 h-4" />
                <span>All Listings</span>
              </button>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <SmartFilters />
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {displayListings.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No listings found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or search criteria
            </p>
            {user && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Suggestions:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Increase your maximum distance</li>
                  <li>• Expand your budget range</li>
                  <li>• Consider different room types</li>
                  <li>• Remove some amenity requirements</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Recommendation Notice */}
            {showRecommended && user && recommendedListings.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Target className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">
                      Personalized Recommendations
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      These listings are specially selected based on your university ({user.university}), 
                      preferences, and budget. Match scores show compatibility.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div 
              className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
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