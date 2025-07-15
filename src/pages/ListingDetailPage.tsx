import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Calendar,
  Users,
  // Removed DollarSign import
  MessageCircle,
  Wifi,
  Car,
  Utensils,
  Home,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  // Removed UniversityIcon import
} from "lucide-react";
import { useListings } from "../contexts/ListingsContext";
import { useMessaging } from "../contexts/MessagingContext";
import { useAuth } from "../contexts/AuthContext";
import {
  getUserPrivacySettings,
  canUserSendMessage,
} from "../hooks/usePrivacy";
import { VerificationBadge } from "../components/VerificationBadge";
import ListingStatusManager from "../components/ListingStatusManager";
import { format } from "date-fns";
import { calculateDistance, formatDistance } from "../utils/haversine";

const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listings, favoriteListings, toggleFavorite, updateListingStatus } =
    useListings();
  const { createConversation } = useMessaging();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);

  const listing = listings.find((l) => l.id === id);

  useEffect(() => {
    if (!listing && listings.length > 0 && !listings.some((l) => l.id === id)) {
      navigate("/browse");
    }
  }, [listing, listings, navigate, id]);

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    );
  }

  const isFavorite = favoriteListings.includes(listing.id);
  const isOwner = user?.id === listing.hostId;

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wi-fi":
        return <Wifi className="w-5 h-5" />;
      case "parking":
        return <Car className="w-5 h-5" />;
      case "kitchen":
        return <Utensils className="w-5 h-5" />;
      case "gym access":
        return <Users className="w-5 h-5" />;
      case "pool":
        return <Home className="w-5 h-5" />;
      default:
        return <Home className="w-5 h-5" />;
    }
  };

  const handleContactHost = async () => {
    console.log("[ListingDetailPage] handleContactHost called");
    console.log("[ListingDetailPage] user:", user?.id);
    console.log("[ListingDetailPage] isOwner:", isOwner);

    if (!user) {
      console.log("[ListingDetailPage] No user, redirecting to login");
      navigate("/login");
      return;
    }

    if (isOwner) {
      console.log("[ListingDetailPage] User is owner, returning");
      return;
    }

    // Check if host allows messages based on their privacy settings
    const userVerificationStatus =
      user?.student_verified ||
      user?.verification_status === "verified" ||
      false;

    console.log("[ListingDetailPage] User verification check:", {
      studentVerified: user?.student_verified,
      verificationStatus: user?.verification_status,
      combinedStatus: userVerificationStatus,
      hostId: listing.host.id,
    });

    const canMessage = canUserSendMessage(
      userVerificationStatus,
      listing.host.id
    );

    console.log("[ListingDetailPage] canMessage:", canMessage);

    if (!canMessage) {
      // Get host settings to show appropriate message
      const hostSettings = getUserPrivacySettings(listing.host.id);
      const message =
        hostSettings.allowMessages === "verified"
          ? "This host only accepts messages from verified users."
          : "This host has disabled direct messages.";
      console.log("[ListingDetailPage] Cannot message host:", message);
      alert(message);
      return;
    }

    try {
      console.log("[ListingDetailPage] Creating conversation...");
      const conversation = await createConversation(listing, listing.host);
      console.log("[ListingDetailPage] Conversation created:", conversation.id);
      navigate("/messages", { state: { activeConversation: conversation } });
    } catch (error) {
      console.error("[ListingDetailPage] Error creating conversation:", error);
      alert(
        `Failed to start conversation: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === listing.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? listing.images.length - 1 : prev - 1
    );
  };

  // Personalized Distance Calculation for Detail Page Header
  let distanceDisplayHeader = "";
  if (
    user?.location?.coordinates?.lat &&
    user?.location?.coordinates?.lng &&
    (user.location.coordinates.lat !== 0 ||
      user.location.coordinates.lng !== 0) &&
    listing.location?.latitude &&
    listing.location?.longitude &&
    (listing.location.latitude !== 0 || listing.location.longitude !== 0)
  ) {
    const distance = calculateDistance(
      user.location.coordinates.lat,
      user.location.coordinates.lng,
      listing.location.latitude,
      listing.location.longitude
    );
    distanceDisplayHeader = `${formatDistance(distance)} from you`;
  } else if (
    listing.location?.nearbyUniversities &&
    listing.location.nearbyUniversities.length > 0
  ) {
    const nearestUni = listing.location.nearbyUniversities[0];
    distanceDisplayHeader = `${formatDistance(nearestUni.distance)} from ${
      nearestUni.name
    }`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => toggleFavorite(listing.id)}
              className={`p-2 rounded-full transition-colors ${
                isFavorite
                  ? "bg-red-100 text-red-600"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              <Heart
                className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
              />
            </button>
            <button
              className="p-2 bg-white text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Share listing"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="relative">
              <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
                {listing.images && listing.images.length > 0 ? (
                  <img
                    src={listing.images[currentImageIndex]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Home className="w-12 h-12 text-gray-400" />
                  </div>
                )}

                {listing.images && listing.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {listing.images.map((_image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentImageIndex
                              ? "bg-white"
                              : "bg-white/50"
                          }`}
                          aria-label={`View image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {listing.images && listing.images.length > 1 && (
                <div className="flex space-x-2 mt-4 overflow-x-auto">
                  {listing.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex
                          ? "border-blue-500"
                          : "border-transparent"
                      }`}
                      aria-label={`Select thumbnail image ${index + 1}`}
                    >
                      <img
                        src={image}
                        alt={`${listing.title} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Listing Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {listing.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{listing.location.city}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Home className="w-4 h-4" />
                      <span className="capitalize">{listing.roomType}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{listing.maxOccupants} max</span>
                    </div>
                    {/* Display personalized or nearest university distance */}
                    {distanceDisplayHeader && (
                      <div className="flex items-center space-x-1">
                        {/* Use MapPin for user distance, or a generic icon if not from user */}
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <span>{distanceDisplayHeader}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    ${listing.price}
                  </div>
                  <div className="text-gray-600">per month</div>
                  {listing.deposit && (
                    <div className="text-sm text-gray-500 mt-1">
                      ${listing.deposit} deposit
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-600 mb-6">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Available {format(listing.availableFrom, "MMM d, yyyy")}
                  </span>
                </div>
                {listing.availableTo && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Until {format(listing.availableTo, "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-gray-700 leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Amenities
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {listing.amenities.map((amenity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {getAmenityIcon(amenity)}
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* House Rules */}
            {listing.rules && listing.rules.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  House Rules
                </h2>
                <ul className="space-y-2">
                  {listing.rules.map((rule, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-gray-700">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Location */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Location
              </h2>
              <div className="space-y-2">
                <p className="text-gray-700">{listing.location.address}</p>
                <p className="text-gray-600">
                  {listing.location.city}, {listing.location.state},{" "}
                  {listing.location.country}
                </p>
                {listing.location.latitude && listing.location.longitude && (
                  <p className="text-sm text-gray-500">
                    (Lat: {listing.location.latitude.toFixed(4)}, Lng:{" "}
                    {listing.location.longitude.toFixed(4)})
                  </p>
                )}
              </div>
              <div className="mt-4 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">Map placeholder</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Host Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Hosted by
              </h3>
              <div className="flex items-center space-x-4 mb-4">
                {listing.host?.profilePicture ? (
                  <img
                    src={listing.host.profilePicture}
                    alt={listing.host.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {listing.host.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {listing.host.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {listing.host.university}
                  </p>
                  <p className="text-sm text-gray-600">{listing.host.year}</p>
                </div>
              </div>

              {listing.host.bio && (
                <p className="text-gray-700 text-sm mb-4">{listing.host.bio}</p>
              )}

              {(listing.host.student_verified ||
                listing.host.verification_status === "verified") && (
                <div className="flex items-center space-x-2 text-sm mb-4">
                  <VerificationBadge isVerified={true} size="sm" />
                </div>
              )}

              {!isOwner && (
                <div className="space-y-3">
                  {(() => {
                    // Check host's messaging privacy settings
                    const hostSettings = getUserPrivacySettings(
                      listing.host.id
                    );
                    const canMessage = canUserSendMessage(
                      user?.student_verified ||
                        user?.verification_status === "verified" ||
                        false,
                      listing.host.id
                    );

                    return (
                      <>
                        <button
                          onClick={handleContactHost}
                          disabled={!canMessage}
                          className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg transition-colors ${
                            canMessage
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>
                            {canMessage
                              ? "Message Host"
                              : hostSettings.allowMessages === "verified"
                                ? "Host accepts verified users only"
                                : "Messaging disabled"}
                          </span>
                        </button>

                        {!canMessage && (
                          <p className="text-xs text-gray-500 text-center">
                            {hostSettings.allowMessages === "verified"
                              ? "Get verified to message this host"
                              : "Host has disabled direct messages"}
                          </p>
                        )}
                      </>
                    );
                  })()}

                  <button
                    onClick={() => setShowContactModal(true)}
                    className="w-full flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Contact Info</span>
                  </button>
                </div>
              )}

              {/* Owner Section - Listing Management */}
              {isOwner && (
                <div className="space-y-4">
                  <ListingStatusManager
                    listing={listing}
                    onStatusUpdate={(newStatus) =>
                      updateListingStatus(listing.id, newStatus)
                    }
                  />
                </div>
              )}
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Preferences
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender preference:</span>
                  <span className="text-gray-900 capitalize">
                    {listing.preferences.gender || "Any"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Smoking:</span>
                  <span className="text-gray-900">
                    {listing.preferences.smokingAllowed
                      ? "Allowed"
                      : "Not allowed"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pets:</span>
                  <span className="text-gray-900">
                    {listing.preferences.petsAllowed
                      ? "Allowed"
                      : "Not allowed"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Study environment:</span>
                  <span className="text-gray-900">
                    {listing.preferences.studyFriendly
                      ? "Study-friendly"
                      : "Social"}
                  </span>
                </div>
              </div>
            </div>

            {/* Utilities */}
            {listing.utilities && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Utilities
                </h3>
                <div className="space-y-2">
                  {listing.utilities.included ? (
                    <p className="text-green-600 font-medium">
                      ✓ All utilities included
                    </p>
                  ) : (
                    <div>
                      <p className="text-gray-600">Utilities not included</p>
                      {listing.utilities.cost && (
                        <p className="text-gray-900">
                          Estimated: ${listing.utilities.cost}/month
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contact Information
            </h3>
            <div className="space-y-4">
              {(() => {
                // Get filtered host data based on their privacy settings
                const hostSettings = getUserPrivacySettings(listing.host.id);

                const showEmail = hostSettings.showEmail;
                const showPhone = hostSettings.showPhone;
                const allowMessages = canUserSendMessage(
                  user?.verified || false,
                  listing.host.id
                );

                return (
                  <>
                    {/* Email display with privacy control */}
                    {showEmail ? (
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">
                          {listing.host.email || "Email not available"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 text-gray-500">
                        <Mail className="w-5 h-5" />
                        <span>Email hidden by host's privacy settings</span>
                      </div>
                    )}

                    {/* Phone display with privacy control */}
                    {showPhone && listing.host.phone ? (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">
                          {listing.host.phone}
                        </span>
                      </div>
                    ) : listing.host.phone && !showPhone ? (
                      <div className="flex items-center space-x-3 text-gray-500">
                        <Phone className="w-5 h-5" />
                        <span>Phone hidden by host's privacy settings</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 text-gray-500">
                        <Phone className="w-5 h-5" />
                        <span>No phone number available</span>
                      </div>
                    )}

                    {/* Messaging availability */}
                    {!allowMessages && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <MessageCircle className="w-4 h-4 inline mr-1" />
                          {hostSettings.allowMessages === "verified"
                            ? "Host only accepts messages from verified users"
                            : "Host has disabled direct messages"}
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetailPage;
