import React, { useState, useEffect } from "react";
import {
  Edit3,
  Save,
  X,
  MapPin,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  LocateFixed,
  Globe,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useListings } from "../contexts/ListingsContext";
import { usePrivacy } from "../hooks/usePrivacy";
import { universityOptions } from "../data/mockData";
import ListingCard from "../components/ListingCard";
import ProfileImageUpload from "../components/ProfileImageUpload";
import { VerificationBadge } from "../components/VerificationBadge";
import { useNavigate } from "react-router-dom";
import GeocodingService from "../utils/geocoding";

const ProfilePage: React.FC = () => {
  const { user, logout, updateProfile, refreshUser } = useAuth();
  const { listings } = useListings();
  const { shouldShowEmail, shouldShowPhone } = usePrivacy();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState<string | null>(
    null
  ); // New state for profile save errors

  // Initialize formData with user's current data
  // Ensure all fields have a default empty string or appropriate fallback
  const [formData, setFormData] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    university: user?.university || "",
    year: user?.year || "",
    phone: user?.phone || "",
    profilePicture: user?.profilePicture || "",
    locationAddress: user?.location?.address || "",
    locationCity: user?.location?.city || "",
    locationState: user?.location?.state || "",
    locationCountry: user?.location?.country || "USA",
    locationLat: user?.location?.coordinates?.lat, // Can be number | undefined
    locationLng: user?.location?.coordinates?.lng, // Can be number | undefined
  });

  // Effect to update formData if user object changes (e.g., after initial load or a successful update)
  // This is crucial to ensure the form is populated with the latest user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        university: user.university || "",
        year: user.year || "",
        phone: user.phone || "",
        profilePicture: user.profilePicture || "",
        locationAddress: user.location?.address || "",
        locationCity: user.location?.city || "",
        locationState: user.location?.state || "",
        locationCountry: user.location?.country || "USA",
        locationLat: user.location?.coordinates?.lat,
        locationLng: user.location?.coordinates?.lng,
      });
      // Clear any previous errors when user data reloads
      setProfileUpdateError(null);
      setLocationError(null);
    }
  }, [user]); // Depend on the 'user' object from AuthContext

  // Refresh user data when the component mounts to catch verification updates
  useEffect(() => {
    const refreshUserData = async () => {
      if (refreshUser) {
        try {
          await refreshUser();
        } catch (error) {
          console.error("Failed to refresh user data:", error);
        }
      }
    };

    refreshUserData();
  }, []); // Run once on mount

  const userListings = listings.filter(
    (listing) => listing.hostId === user?.id
  );

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleProfileImageChange = (imageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      profilePicture: imageUrl,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setProfileUpdateError(null); // Clear previous save errors

    // Construct the location object to pass to updateProfile
    // Ensure coordinates are always numbers, even if 0
    const updatedLocation = {
      address: formData.locationAddress,
      city: formData.locationCity,
      state: formData.locationState,
      country: formData.locationCountry,
      coordinates: {
        lat: formData.locationLat ?? 0, // Use nullish coalescing for safety
        lng: formData.locationLng ?? 0, // Use nullish coalescing for safety
      },
    };

    try {
      await updateProfile({
        name: formData.name,
        bio: formData.bio,
        university: formData.university,
        year: formData.year,
        phone: formData.phone,
        profilePicture: formData.profilePicture,
        location: updatedLocation, // Pass the constructed location object
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setProfileUpdateError(
        error.message || "Failed to update profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset formData to original user values
    // Ensure all fields are reset with proper fallbacks
    setFormData({
      name: user?.name || "",
      bio: user?.bio || "",
      university: user?.university || "",
      year: user?.year || "",
      phone: user?.phone || "",
      profilePicture: user?.profilePicture || "",
      locationAddress: user?.location?.address || "",
      locationCity: user?.location?.city || "",
      locationState: user?.location?.state || "",
      locationCountry: user?.location?.country || "USA",
      locationLat: user?.location?.coordinates?.lat,
      locationLng: user?.location?.coordinates?.lng,
    });
    setIsEditing(false);
    setProfileUpdateError(null); // Clear errors on cancel
    setLocationError(null);
    setLocationLoading(false);
  };

  const handleGeocodeAddress = async () => {
    setLocationLoading(true);
    setLocationError(null);
    setProfileUpdateError(null); // Clear profile update error as this is a new action

    const fullAddress = `${formData.locationAddress}, ${formData.locationCity}, ${formData.locationState}, ${formData.locationCountry}`;
    if (
      !formData.locationAddress ||
      !formData.locationCity ||
      !formData.locationState
    ) {
      setLocationError("Address, city, and state are required for geocoding.");
      setLocationLoading(false);
      return;
    }

    try {
      const result = await GeocodingService.geocodeAddress(fullAddress);
      if (
        result.success &&
        typeof result.latitude === "number" &&
        typeof result.longitude === "number"
      ) {
        setFormData((prev) => ({
          ...prev,
          locationLat: result.latitude,
          locationLng: result.longitude,
          // Update address/city/state from formatted_address for better consistency if geocoding returns a better one
          locationAddress: result.formattedAddress ?? formData.locationAddress,
          locationCity:
            result.formattedAddress?.split(",").slice(-3, -2)[0]?.trim() ||
            formData.locationCity, // Heuristic: City is usually 3rd from end
          locationState:
            result.formattedAddress
              ?.split(",")
              .slice(-2, -1)[0]
              ?.trim()
              .split(" ")[0] || formData.locationState, // Heuristic: State from 2nd last
          locationCountry:
            result.formattedAddress?.split(",").pop()?.trim() ||
            formData.locationCountry, // Heuristic: Last is country
        }));
        console.log("Address geocoded successfully:", result);
      } else {
        setLocationError(
          result.error ||
            "Could not find coordinates for this address. Please check and try again."
        );
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
      setLocationError("Failed to geocode address. Please try again.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleGetGeolocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    setProfileUpdateError(null); // Clear profile update error as this is a new action

    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by this browser.");
      setLocationLoading(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          });
        }
      );

      const { latitude, longitude } = position.coords;

      const reverseGeocodeResult = await GeocodingService.reverseGeocode(
        latitude,
        longitude
      );
      let city = "Unknown City";
      let state = "Unknown State";
      let country = "USA";
      let address = "";

      if (
        reverseGeocodeResult.success &&
        reverseGeocodeResult.formattedAddress
      ) {
        address = reverseGeocodeResult.formattedAddress;
        const addressParts = reverseGeocodeResult.formattedAddress
          .split(",")
          .map((s) => s.trim());
        if (addressParts.length >= 4) {
          // e.g., Street, City, State ZIP, Country
          address = addressParts[0]; // Just the street part
          city = addressParts[addressParts.length - 3];
          state = addressParts[addressParts.length - 2].split(" ")[0];
          country = addressParts[addressParts.length - 1];
        } else if (addressParts.length >= 3) {
          // e.g., City, State, Country
          address = addressParts[0]; // Take first part as general address if full not available
          city = addressParts[0];
          state = addressParts[1];
          country = addressParts[2];
        } else if (addressParts.length === 2) {
          // just city, state
          address = addressParts[0];
          city = addressParts[0];
          state = addressParts[1];
        }
      }

      setFormData((prev) => ({
        ...prev,
        locationLat: latitude,
        locationLng: longitude,
        locationAddress: address || "",
        locationCity: city,
        locationState: state,
        locationCountry: country,
      }));
      console.log("Geolocation obtained and reverse geocoded.");
    } catch (err: any) {
      if (err.code === err.PERMISSION_DENIED) {
        setLocationError(
          "Geolocation permission denied. Please enable location services in your browser settings."
        );
      } else {
        setLocationError(
          "Failed to get current location. " +
            (err.message || "Please try again.")
        );
      }
      console.error("Geolocation error:", err);
    } finally {
      setLocationLoading(false);
    }
  };

  // If user data is not loaded yet or explicitly null, show loading/login message
  // This ensures the page doesn't try to render user-specific data before it's available
  // The 'user' object from AuthContext will be null initially while isLoading is true.
  // Once isLoading becomes false, 'user' will either be null (not logged in) or the user object.
  if (!user && !locationLoading && !isSaving) {
    // Exclude transient loading states
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in to view your profile
          </h2>
          <button
            onClick={() => navigate("/login")}
            className="text-blue-600 hover:text-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // If AuthContext is still loading the user, show a loading spinner
  // This covers the initial app load and auth state changes
  if (!user && (locationLoading || isSaving)) {
    // These specific flags are for actions on this page
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-teal-500"></div>

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 -mt-16">
              {/* Profile Picture */}
              <div className="relative">
                <ProfileImageUpload
                  currentImage={
                    isEditing ? formData.profilePicture : user?.profilePicture
                  } // Safely access user?.profilePicture
                  onImageChange={handleProfileImageChange}
                  userName={user?.name || "User"} // Safely access user?.name
                  disabled={!isEditing}
                  size="lg"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1 mt-4 sm:mt-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="text-2xl font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                      />
                    ) : (
                      <h1 className="text-2xl font-bold text-gray-900">
                        {user?.name || "Guest User"}
                      </h1>
                    )}

                    <div className="flex items-center space-x-4 mt-2 text-gray-600">
                      <div className="flex items-center space-x-1">
                        <GraduationCap className="w-4 h-4" />
                        <span>{user?.university || "N/A"}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{user?.year || "N/A"}</span>
                      </div>
                      <VerificationBadge
                        isVerified={
                          user?.student_verified ||
                          user?.verification_status === "verified"
                        }
                        onClick={
                          !(
                            user?.student_verified ||
                            user?.verification_status === "verified"
                          )
                            ? () => navigate("/verification")
                            : undefined
                        }
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSave}
                          disabled={isSaving || locationLoading}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isSaving ? "Saving..." : "Save"}</span>
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={isSaving || locationLoading}
                          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </button>
                    )}
                  </div>
                </div>
                {profileUpdateError && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg mt-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{profileUpdateError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* About */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                About
              </h2>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell others about yourself..."
                />
              ) : (
                <p className="text-gray-700">
                  {user?.bio || "No bio added yet."}
                </p>
              )}
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Contact Information
              </h2>
              <div className="space-y-3">
                {/* Email - respect privacy settings */}
                {shouldShowEmail() ? (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {user?.email || "N/A"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 text-gray-500">
                    <Mail className="w-4 h-4" />
                    <span>Email hidden by privacy settings</span>
                  </div>
                )}

                {/* Phone - respect privacy settings */}
                {isEditing ? (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Phone number"
                    />
                  </div>
                ) : shouldShowPhone() && user?.phone ? (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{user.phone}</span>
                  </div>
                ) : !shouldShowPhone() && user?.phone ? (
                  <div className="flex items-center space-x-3 text-gray-500">
                    <Phone className="w-4 h-4" />
                    <span>Phone hidden by privacy settings</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 text-gray-500">
                    <Phone className="w-4 h-4" />
                    <span>No phone added.</span>
                  </div>
                )}
              </div>
            </div>

            {/* University Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                University
              </h2>
              <div className="space-y-3">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        University
                      </label>
                      <select
                        name="university"
                        value={formData.university}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {universityOptions.map((uni) => (
                          <option key={uni} value={uni}>
                            {uni}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year
                      </label>
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Freshman">Freshman</option>
                        <option value="Sophomore">Sophomore</option>
                        <option value="Junior">Junior</option>
                        <option value="Senior">Senior</option>
                        <option value="Graduate">Graduate</option>
                        <option value="PhD">PhD</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      <span>{user?.university || "N/A"}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{user?.year || "N/A"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Location Information
              </h2>
              {isEditing ? (
                <div className="space-y-3">
                  {/* Address fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="locationAddress"
                      value={formData.locationAddress}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Street address (e.g., 123 Main St)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="locationCity"
                        value={formData.locationCity}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        name="locationState"
                        value={formData.locationState}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="State (e.g., CA)"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="locationCountry"
                      value={formData.locationCountry}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Country (e.g., USA)"
                    />
                  </div>
                  {/* Geocoding actions */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      type="button"
                      onClick={handleGeocodeAddress}
                      disabled={locationLoading}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {locationLoading ? (
                        <Globe className="w-4 h-4 animate-spin" />
                      ) : (
                        <Globe className="w-4 h-4" />
                      )}
                      <span>Geocode Address</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGetGeolocation}
                      disabled={locationLoading}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {locationLoading ? (
                        <LocateFixed className="w-4 h-4 animate-spin" />
                      ) : (
                        <LocateFixed className="w-4 h-4" />
                      )}
                      <span>Use Current Location</span>
                    </button>
                  </div>
                  {locationError && (
                    <p className="text-red-600 text-sm mt-2">{locationError}</p>
                  )}
                  {/* Display current coordinates (for debugging/info) */}
                  {typeof formData.locationLat === "number" &&
                    typeof formData.locationLng === "number" && (
                      <p className="text-sm text-gray-500 mt-2">
                        Coordinates: {formData.locationLat.toFixed(4)},{" "}
                        {formData.locationLng.toFixed(4)}
                      </p>
                    )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-gray-700">
                        {user?.location?.address || "N/A"}
                      </p>
                      <p className="text-gray-700">
                        {user?.location?.city || "N/A"},{" "}
                        {user?.location?.state || "N/A"},{" "}
                        {user?.location?.country || "N/A"}
                      </p>
                    </div>
                  </div>
                  {user?.location?.coordinates?.lat &&
                    user?.location?.coordinates?.lng && (
                      <p className="text-sm text-gray-500">
                        (Lat: {user.location.coordinates.lat.toFixed(4)}, Lng:{" "}
                        {user.location.coordinates.lng.toFixed(4)})
                      </p>
                    )}
                  {!user?.location?.address && !user?.location?.city && (
                    <p className="text-sm text-gray-500">
                      No location set. Edit profile to add your location for
                      personalized results!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Account
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/verification")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                    user?.student_verified ||
                    user?.verification_status === "verified"
                      ? "text-green-700 hover:bg-green-50"
                      : "text-yellow-700 hover:bg-yellow-50"
                  }`}
                >
                  <span>Account Verification</span>
                  <VerificationBadge
                    isVerified={
                      user?.student_verified ||
                      user?.verification_status === "verified"
                    }
                    size="sm"
                    showText={false}
                  />
                </button>
                <button
                  onClick={() => navigate("/change-password")}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Change Password
                </button>
                <button
                  onClick={() => navigate("/privacy-settings")}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Privacy Settings
                </button>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* My Listings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  My Listings
                </h2>
                <button
                  onClick={() => navigate("/create")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create New Listing
                </button>
              </div>

              {userListings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No listings yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Create your first listing to start hosting students
                  </p>
                  <button
                    onClick={() => navigate("/create")}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Listing
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onClick={() => navigate(`/listing/${listing.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
