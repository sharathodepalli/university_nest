import React from "react";
import {
  Heart,
  MapPin,
  Users,
  Calendar,
  Home,
  CaseSensitive as UniversityIcon,
} from "lucide-react";
import { Listing } from "../types";
import { useListings } from "../contexts/ListingsContext";
import { useAuth } from "../contexts/AuthContext";
import MatchingService from "../lib/matching";
import { calculateDistance, formatDistance } from "../utils/haversine";
import LazyImage from "./LazyImage";
import { sanitizeHtml } from "../lib/validation";

interface ListingCardProps {
  listing: Listing;
  onClick?: () => void;
  showMatchScore?: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onClick,
  showMatchScore = true,
}) => {
  const { user } = useAuth();
  const { favoriteListings, toggleFavorite } = useListings();

  // Safety checks for rendering a valid card
  if (!listing || !listing.id) {
    return null;
  }

  const isFavorite = favoriteListings.includes(listing.id);

  // Calculate match score only if user is logged in and showMatchScore is true
  const matchScore =
    user && showMatchScore
      ? MatchingService.calculateMatchScore(user, listing)
      : null;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(listing.id);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-blue-600 bg-blue-100";
    if (score >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-gray-600 bg-gray-100";
  };

  // --- Safe data extraction with fallbacks and improved clarity ---
  const images =
    listing.images && listing.images.length > 0 ? listing.images : [""];
  const primaryImage = images[0];

  const safeTitle = sanitizeHtml(listing.title || "Untitled Listing");
  const price = typeof listing.price === "number" ? listing.price : 0; // CORRECTED: Changed 'price' to 'listing.price'
  const roomTypeDisplay = listing.roomType
    ? listing.roomType.charAt(0).toUpperCase() + listing.roomType.slice(1)
    : "Room";

  const hostNameInitial = listing.host?.name
    ? listing.host.name.charAt(0).toUpperCase()
    : "?";
  const hostUniversityDisplay =
    listing.host?.university || "Unknown University";

  const locationCityState = listing.location?.city || "Unknown City";

  const nearestUniversityInfo =
    listing.location?.nearbyUniversities &&
    listing.location.nearbyUniversities.length > 0
      ? listing.location.nearbyUniversities[0]
      : null;

  const isNearUserUniversity =
    user?.university &&
    (listing.location?.nearbyUniversities || []).some(
      (uni) => uni.name === user.university
    );

  // Select a few key amenities to display as badges
  const keyAmenities = (listing.amenities || [])
    .filter((amenity) =>
      [
        "Wi-Fi",
        "Laundry",
        "Kitchen",
        "Parking",
        "Gym Access",
        "Furnished",
      ].includes(amenity)
    )
    .slice(0, 3);

  const availableFromDisplay = listing.availableFrom
    ? new Date(listing.availableFrom).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "TBD";

  // --- Personalized Distance Calculation ---
  let distanceToDisplay = "";
  let distanceIcon = (
    <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
  );
  let distanceLabel = locationCityState;

  // Prioritize user's actual location if available and valid
  if (
    user?.location?.coordinates?.lat &&
    user?.location?.coordinates?.lng &&
    (user.location.coordinates.lat !== 0 ||
      user.location.coordinates.lng !== 0) &&
    listing.location?.latitude &&
    listing.location?.longitude &&
    (listing.location.latitude !== 0 || listing.location.longitude !== 0)
  ) {
    const userLat = user.location.coordinates.lat;
    const userLng = user.location.coordinates.lng;
    const listingLat = listing.location.latitude;
    const listingLng = listing.location.longitude;

    const distance = calculateDistance(
      userLat,
      userLng,
      listingLat,
      listingLng
    );
    distanceToDisplay = formatDistance(distance);
    distanceLabel = `from you`;
    distanceIcon = (
      <MapPin className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
    );
  } else if (nearestUniversityInfo) {
    // Fallback to nearest university to the listing if user location is not valid
    distanceToDisplay = formatDistance(nearestUniversityInfo.distance);
    distanceLabel = `from ${nearestUniversityInfo.name}`;
    distanceIcon = (
      <UniversityIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
    );
  }

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-gray-200 relative group"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`View details for ${safeTitle} in ${locationCityState}`}
    >
      {/* Image Gallery */}
      <div className="relative">
        <LazyImage
          src={primaryImage}
          alt={safeTitle}
          className="w-full h-48 object-cover"
          onError={() => {
            console.warn(`Failed to load image for listing ${listing.id}`);
          }}
        />
        {/* Fallback for completely missing images */}
        {images.length === 0 && (
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
            <Home className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
            {roomTypeDisplay}
          </span>

          {isNearUserUniversity && (
            <span className="bg-blue-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-white flex items-center space-x-1 shadow-sm">
              <UniversityIcon className="w-3 h-3" />
              <span>Your Uni</span>
            </span>
          )}
        </div>

        {/* Match Score */}
        {matchScore !== null && matchScore > 0 && (
          <div className="absolute top-3 right-12">
            <div
              className={`px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${getMatchScoreColor(
                matchScore
              )}`}
            >
              {matchScore}% match
            </div>
          </div>
        )}

        {/* Favorite Button */}
        <div className="absolute top-3 right-3">
          <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isFavorite
                ? "bg-red-500 text-white shadow-md"
                : "bg-white/80 text-gray-600 hover:bg-white hover:text-red-500 shadow-sm"
            }`}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 flex-1 mr-4">
            {safeTitle}
          </h3>
          <div className="flex-shrink-0">
            <span className="text-xl font-bold text-gray-900">${price}</span>
            <span className="text-sm text-gray-500">/mo</span>
          </div>
        </div>

        {/* Consolidated Location Info (User-specific or Nearest Uni) */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          {distanceIcon}
          <span className="line-clamp-1">
            {distanceToDisplay ? (
              <>
                {distanceToDisplay}{" "}
                {distanceLabel && <strong>{distanceLabel}</strong>}
              </>
            ) : (
              locationCityState
            )}
          </span>
        </div>

        {/* Key Amenities */}
        {keyAmenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {keyAmenities.map((amenity, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
              >
                {amenity}
              </span>
            ))}
          </div>
        )}

        {/* Host Info & Other Details */}
        <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-100 pt-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {listing.host?.profilePicture ? (
              <img
                src={listing.host.profilePicture}
                alt={listing.host.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">
                  {hostNameInitial}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-medium text-gray-900 truncate"
                title={listing.host?.name}
              >
                {listing.host?.name || "Unknown Host"}
              </p>
              <p
                className="text-xs text-gray-500 truncate"
                title={hostUniversityDisplay}
              >
                {hostUniversityDisplay}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {listing.maxOccupants || 1}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {availableFromDisplay}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ListingCard);
