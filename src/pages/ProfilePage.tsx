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
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useListings } from "../contexts/ListingsContext";
import { usePrivacy } from "../hooks/usePrivacy";
import { universityOptions } from "../data/mockData";
import ListingCard from "../components/ListingCard";
import ProfileImageUpload from "../components/ProfileImageUpload";
import FastAddressInput from "../components/FastAddressInput";
import { VerificationBadge } from "../components/VerificationBadge";
import StatusBadge from "../components/StatusBadge";
import { useNavigate } from "react-router-dom";

const ProfilePage: React.FC = () => {
  const { user, logout, updateProfile, isLoading: isAuthLoading } = useAuth();
  const { getUserListings } = useListings();
  const { shouldShowEmail, shouldShowPhone } = usePrivacy();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState<string | null>(
    null
  );

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
    locationLng: user?.location?.coordinates?.lng,
  });

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
      setProfileUpdateError(null);
      setLocationError(null);
    }
  }, [user]);

  const userListings = user ? getUserListings(user.id) : [];

  // Separate listings by status for better display
  const activeListings = userListings.filter(
    (listing) => listing.status === "active"
  );
  const rentedListings = userListings.filter(
    (listing) => listing.status === "rented"
  );
  const inactiveListings = userListings.filter(
    (listing) => listing.status === "inactive"
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

    const updatedLocation = {
      address: formData.locationAddress,
      city: formData.locationCity,
      state: formData.locationState,
      country: formData.locationCountry,
      coordinates: {
        lat: formData.locationLat ?? 0,
        lng: formData.locationLng ?? 0,
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
      setProfileUpdateError(
        error.message || "Failed to update profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30">
      {/* Enhanced Container with better spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Enhanced Profile Header */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8 relative backdrop-blur-sm">
          {/* Dynamic gradient background with animated elements */}
          <div className="h-48 lg:h-56 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.1),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.08),transparent_50%)]"></div>

            {/* Floating geometric shapes */}
            <div className="absolute top-8 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute top-16 left-12 w-8 h-8 bg-white/15 rounded-lg rotate-45"></div>
            <div className="absolute bottom-12 right-16 w-12 h-12 bg-white/10 rounded-full"></div>

            {/* Verification badge in header */}
            <div className="absolute top-6 right-6">
              <div className="shadow-lg bg-white/90 backdrop-blur-sm rounded-full p-1">
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
                  size="lg"
                />
              </div>
            </div>
          </div>

          <div className="px-6 lg:px-8 pb-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:space-x-8 -mt-24 lg:-mt-28">
              {/* Enhanced Profile Picture with better positioning */}
              <div className="relative flex-shrink-0 self-center lg:self-end">
                <div className="ring-6 ring-white rounded-full shadow-2xl">
                  <ProfileImageUpload
                    currentImage={
                      isEditing ? formData.profilePicture : user?.profilePicture
                    }
                    onImageChange={handleProfileImageChange}
                    userName={user?.name || "User"}
                    disabled={!isEditing}
                    size="lg"
                  />
                </div>
                {/* Online status indicator */}
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full shadow-lg"></div>
              </div>

              {/* Enhanced Profile Info with better spacing */}
              <div className="flex-1 mt-8 lg:mt-0 text-center lg:text-left">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between lg:space-x-6">
                  <div className="flex-1 min-w-0">
                    {/* Name Section with enhanced styling */}
                    <div className="mb-4">
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="text-3xl lg:text-4xl font-bold text-gray-900 bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none text-center lg:text-left w-full transition-colors placeholder-gray-400"
                          placeholder="Your name"
                        />
                      ) : (
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 truncate">
                          {user?.name || "Guest User"}
                        </h1>
                      )}
                    </div>

                    {/* Enhanced Info Pills with better design */}
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
                      <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-full text-sm font-medium shadow-sm border border-blue-200">
                        <GraduationCap className="w-4 h-4" />
                        <span className="truncate max-w-32 lg:max-w-none">
                          {user?.university || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-full text-sm font-medium shadow-sm border border-green-200">
                        <Calendar className="w-4 h-4" />
                        <span>{user?.year || "N/A"}</span>
                      </div>
                    </div>

                    {/* Bio Preview with better styling */}
                    {!isEditing && user?.bio && (
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <p className="text-gray-700 text-sm lg:text-base leading-relaxed line-clamp-3">
                          {user.bio}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Action Buttons with better design */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 lg:mt-0 lg:flex-shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSave}
                          disabled={isSaving || locationLoading}
                          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold transform hover:scale-105"
                        >
                          <Save className="w-5 h-5" />
                          <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={isSaving || locationLoading}
                          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                          <X className="w-5 h-5" />
                          <span>Cancel</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl hover:from-gray-800 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold transform hover:scale-105"
                        >
                          <Edit3 className="w-5 h-5" />
                          <span>Edit Profile</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Error Display with better styling */}
                {profileUpdateError && (
                  <div className="flex items-start space-x-3 text-red-600 text-sm bg-red-50 px-6 py-4 rounded-2xl mt-6 border border-red-200 shadow-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="flex-1">{profileUpdateError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Enhanced Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* About Section with enhanced styling */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">About</h2>
              </div>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-gray-700 placeholder-gray-400"
                  placeholder="Tell others about yourself, your interests, and what makes you unique..."
                />
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed text-sm lg:text-base">
                    {user?.bio || (
                      <span className="text-gray-500 italic">
                        No bio added yet. Add one to help others get to know you
                        better!
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Enhanced Contact Info */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-green-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Contact</h2>
              </div>
              <div className="space-y-4">
                {/* Email */}
                {shouldShowEmail() ? (
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        Email
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {user?.email || "N/A"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                    <Mail className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <span className="text-sm text-yellow-700 font-medium">
                      Email hidden by privacy settings
                    </span>
                  </div>
                )}

                {/* Phone */}
                {isEditing ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      Phone Number
                    </label>
                    <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-2xl focus-within:border-blue-500 transition-colors">
                      <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="flex-1 outline-none text-sm"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                ) : shouldShowPhone() && user?.phone ? (
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        Phone
                      </p>
                      <p className="text-sm text-gray-600">{user?.phone}</p>
                    </div>
                  </div>
                ) : !shouldShowPhone() && user?.phone ? (
                  <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                    <Phone className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <span className="text-sm text-yellow-700 font-medium">
                      Phone hidden by privacy settings
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-500 font-medium">
                      No phone number added
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced University Info */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Education
                </h2>
              </div>
              <div className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        University
                      </label>
                      <select
                        name="university"
                        value={formData.university}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      >
                        {universityOptions.map((uni) => (
                          <option key={uni} value={uni}>
                            {uni}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Academic Year
                      </label>
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      >
                        <option value="Freshman">Freshman</option>
                        <option value="Sophomore">Sophomore</option>
                        <option value="Junior">Junior</option>
                        <option value="Senior">Senior</option>
                        <option value="Graduate">Graduate</option>
                        <option value="PhD">PhD</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          University
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {user?.university || "Not specified"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          Academic Year
                        </p>
                        <p className="text-sm text-gray-600">
                          {user?.year || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Location Information */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Location
                </h2>
              </div>
              {isEditing ? (
                <div className="space-y-4">
                  {/* Enhanced Address Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <FastAddressInput
                      value={formData.locationAddress}
                      onChange={(address: string) => {
                        setFormData((prev) => ({
                          ...prev,
                          locationAddress: address,
                        }));
                        setLocationError(null);
                      }}
                      onCityChange={(city: string) => {
                        setFormData((prev) => ({
                          ...prev,
                          locationCity: city,
                        }));
                      }}
                      onStateChange={(state: string) => {
                        setFormData((prev) => ({
                          ...prev,
                          locationState: state,
                        }));
                      }}
                      onAddressSelect={(addressDetails: any) => {
                        setFormData((prev) => ({
                          ...prev,
                          locationAddress:
                            addressDetails.streetAddress ||
                            addressDetails.fullAddress,
                          locationCity:
                            addressDetails.city || prev.locationCity,
                          locationState:
                            addressDetails.state || prev.locationState,
                          locationCountry:
                            addressDetails.country || prev.locationCountry,
                          locationLat: addressDetails.latitude,
                          locationLng: addressDetails.longitude,
                        }));
                        setLocationError(null);
                      }}
                      error={locationError || undefined}
                      placeholder="Enter your street address"
                      showCurrentLocation={true}
                      restrictToCountry="US"
                      className="w-full"
                    />
                  </div>

                  {/* City and State Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        name="locationCity"
                        value={formData.locationCity}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        name="locationState"
                        value={formData.locationState}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="State code (e.g., CA)"
                      />
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="locationCountry"
                      value={formData.locationCountry}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Country (e.g., USA)"
                    />
                  </div>

                  {/* Error Display */}
                  {locationError && (
                    <div className="flex items-start space-x-3 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-200">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{locationError}</span>
                    </div>
                  )}

                  {/* Coordinates Info */}
                  {typeof formData.locationLat === "number" &&
                    typeof formData.locationLng === "number" && (
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-sm text-blue-700 font-medium">
                          📍 Coordinates: {formData.locationLat.toFixed(4)},{" "}
                          {formData.locationLng.toFixed(4)}
                        </p>
                      </div>
                    )}
                </div>
              ) : (
                <div className="space-y-4">
                  {user?.location?.address || user?.location?.city ? (
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <MapPin className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            Address
                          </p>
                          <p className="text-sm text-gray-600 break-words">
                            {user?.location?.address || "Not specified"}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {[
                              user?.location?.city,
                              user?.location?.state,
                              user?.location?.country,
                            ]
                              .filter(Boolean)
                              .join(", ") || "Location details not available"}
                          </p>
                        </div>
                      </div>

                      {user?.location?.coordinates?.lat &&
                        user?.location?.coordinates?.lng && (
                          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                            <p className="text-sm text-blue-700">
                              📍 Coordinates:{" "}
                              {user?.location?.coordinates?.lat?.toFixed(4)},{" "}
                              {user?.location?.coordinates?.lng?.toFixed(4)}
                            </p>
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <MapPin className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          No location set
                        </p>
                        <p className="text-sm text-yellow-700">
                          Add your location to help others find you and get
                          personalized results!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Account Actions */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-gray-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Account Settings
                </h2>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => navigate("/verification")}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-between group ${
                    user?.student_verified ||
                    user?.verification_status === "verified"
                      ? "text-green-700 bg-green-50 hover:bg-green-100 border border-green-200"
                      : "text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200"
                  }`}
                >
                  <span className="font-medium">Student Verification</span>
                  <div className="flex items-center space-x-2">
                    <VerificationBadge
                      isVerified={
                        user?.student_verified ||
                        user?.verification_status === "verified"
                      }
                      size="sm"
                      showText={false}
                    />
                    <div className="w-5 h-5 bg-white/50 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
                      <span className="text-xs">→</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigate("/change-password")}
                  className="w-full text-left px-4 py-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200 font-medium"
                >
                  Change Password
                </button>

                <button
                  onClick={() => navigate("/privacy-settings")}
                  className="w-full text-left px-4 py-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200 font-medium"
                >
                  Privacy Settings
                </button>

                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 border border-red-200 font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced My Listings Section */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    My Listings
                  </h2>
                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                    <p>
                      {userListings.length} total listing
                      {userListings.length !== 1 ? "s" : ""}
                    </p>
                    {userListings.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {activeListings.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800">
                            {activeListings.length} active
                          </span>
                        )}
                        {rentedListings.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {rentedListings.length} rented
                          </span>
                        )}
                        {inactiveListings.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                            {inactiveListings.length} inactive
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate("/create")}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  <span>Create New Listing</span>
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-xs">+</span>
                  </div>
                </button>
              </div>

              {userListings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No listings yet
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Ready to start hosting? Create your first listing and
                    connect with students looking for housing.
                  </p>
                  <button
                    onClick={() => navigate("/create")}
                    className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                  >
                    <span>Create Your First Listing</span>
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-xs">→</span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {userListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="group cursor-pointer transform hover:scale-[1.02] transition-all duration-200 relative"
                      onClick={() => navigate(`/listing/${listing.id}`)}
                    >
                      {/* Status Badge Overlay */}
                      <div className="absolute top-2 right-2 z-10">
                        <StatusBadge status={listing.status} size="sm" />
                      </div>
                      <ListingCard
                        listing={listing}
                        onClick={() => navigate(`/listing/${listing.id}`)}
                      />
                    </div>
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
