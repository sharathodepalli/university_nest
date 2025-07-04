import React from "react";
import {
  Heart,
  MapPin,
  Users,
  Calendar,
  Wifi,
  Car,
  Utensils,
  Home,
  CaseSensitive as University,
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

  // Safety checks
  if (!listing || !listing.id) {
    return null;
  }

  const isFavorite = favoriteListings.includes(listing.id);

  // Calculate match score if user is logged in
  const matchScore =
    user && showMatchScore
      ? MatchingService.calculateMatchScore(user, listing)
      : null;

  const getAmenityIcon = (amenity: string) => {
    if (!amenity || typeof amenity !== "string")
      return <Home className="w-4 h-4" />;

    switch (amenity.toLowerCase()) {
      case "wi-fi":
        return <Wifi className="w-4 h-4" />;
      case "parking":
        return <Car className="w-4 h-4" />;
      case "kitchen":
        return <Utensils className="w-4 h-4" />;
      default:
        return <Home className="w-4 h-4" />;
    }
  };

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

  // Safe data extraction with fallbacks
  const nearbyUniversities = listing.location?.nearbyUniversities || [];
  const nearestUniversity =
    nearbyUniversities.length > 0 ? nearbyUniversities[0] : null;

  const isNearUserUniversity =
    user?.university &&
    nearbyUniversities.some((uni) => uni.name === user.university);
  const amenities = listing.amenities || [];
  const images = listing.images || [];
  const host = listing.host || {
    name: "Unknown Host",
    university: "Unknown University",
  };
  const location = listing.location || { city: "Unknown Location" };
  const price = typeof listing.price === "number" ? listing.price : 0;

  // Sanitize user-generated content
  const safeTitle = sanitizeHtml(listing.title || "Untitled Listing");
  const safeDescription = sanitizeHtml(
    listing.description || "No description available."
  );

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
      aria-label={`View details for ${safeTitle}`}
    >
      {/* Image Gallery */}
      <div className="relative">
        {images.length > 0 ? (
          <LazyImage
            src={images[0]}
            alt={safeTitle}
            className="w-full h-48"
            onError={() =>
              console.warn(`Failed to load image for listing ${listing.id}`)
            }
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <Home className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
            {listing.roomType
              ? listing.roomType.charAt(0).toUpperCase() +
                listing.roomType.slice(1)
              : "Unknown Type"}
          </span>

          {isNearUserUniversity && (
            <span className="bg-blue-500/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white flex items-center space-x-1">
              <University className="w-3 h-3" />
              <span>Your Uni</span>
            </span>
          )}
        </div>

        {/* Match Score */}
        {matchScore !== null && matchScore > 0 && (
          <div className="absolute top-3 right-12">
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(
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
                ? "bg-red-500 text-white"
                : "bg-white/80 text-gray-600 hover:bg-white hover:text-red-500"
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

        {/* University & Location Info */}
        {nearestUniversity && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <University className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="line-clamp-1">
              {formatDistance(nearestUniversity.distance)} from{" "}
              <strong>{nearestUniversity.name}</strong>
            </span>
          </div>
        )}

        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
          <span className="line-clamp-1">{location.city}</span>
        </div>

        {/* Key Details */}
        <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-100 pt-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">
                {host.name ? host.name.charAt(0).toUpperCase() : "?"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-medium text-gray-900 truncate"
                title={host.name}
              >
                {host.name}
              </p>
              <p
                className="text-xs text-gray-500 truncate"
                title={host.university}
              >
                {host.university}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {listing.maxOccupants || 1}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {listing.availableFrom
                  ? new Date(listing.availableFrom).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                      }
                    )
                  : "TBD"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ListingCard);
