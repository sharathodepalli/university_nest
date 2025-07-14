import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  DollarSign,
  Home,
  Users,
  Calendar,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useListings } from "../contexts/ListingsContext";
import { amenityOptions, roomTypeOptions } from "../data/mockData";
import { getNearbyUniversities } from "../data/universities";
import ImageUpload from "../components/ImageUpload";
import FastAddressInput from "../components/FastAddressInput";

const CreateListingPage: React.FC = () => {
  const { user, isSupabaseReady } = useAuth();
  const { addListing } = useListings();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    address: "",
    city: "",
    state: "California",
    roomType: "single" as const,
    maxOccupants: 1,
    availableFrom: "",
    availableTo: "",
    deposit: "",
    utilitiesIncluded: true,
    utilitiesCost: "",
    gender: "any" as const,
    smokingAllowed: false,
    petsAllowed: false,
    studyFriendly: true,
  });

  const [addressCoordinates, setAddressCoordinates] = useState<{
    latitude?: number;
    longitude?: number;
    placeId?: string;
  }>({});

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [rules, setRules] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [addressError, setAddressError] = useState<string>("");
  const [imageUploadInProgress, setImageUploadInProgress] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleAmenityToggle = (amenityValue: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityValue)
        ? prev.filter((a) => a !== amenityValue)
        : [...prev, amenityValue]
    );
  };

  const handleRuleChange = (index: number, value: string) => {
    setRules((prev) => prev.map((rule, i) => (i === index ? value : rule)));
  };

  const addRule = () => {
    setRules((prev) => [...prev, ""]);
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const onImageUploadStart = () => {
    setImageUploadInProgress(true);
    setUploadError("");
  };

  const onImageUploadComplete = (_urls: string[]) => {
    setImageUploadInProgress(false);
  };

  const onImageUploadError = (error: string) => {
    setImageUploadInProgress(false);
    setUploadError(`Image upload failed: ${error}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (images.length === 0) {
      setUploadError("Please upload at least one image.");
      return;
    }

    const hasLocalImages = images.some((url) => url.startsWith("blob:"));
    if (isSupabaseReady && hasLocalImages) {
      setUploadError(
        "Some images are still local previews (failed to upload to cloud storage). Please ensure all images upload successfully or check your Supabase configuration."
      );
      return;
    }

    if (imageUploadInProgress) {
      setUploadError(
        "Image upload is still in progress. Please wait for it to complete."
      );
      return;
    }

    setIsSubmitting(true);
    setUploadError("");
    setAddressError("");

    try {
      let latitude: number;
      let longitude: number;

      // Use coordinates from autocomplete if available, otherwise geocode
      if (addressCoordinates.latitude && addressCoordinates.longitude) {
        latitude = addressCoordinates.latitude;
        longitude = addressCoordinates.longitude;
      } else {
        // DYNAMIC IMPORT: Load GeocodingService only when needed for submission
        const { default: GeocodingService } = await import(
          "../utils/geocoding"
        );

        const fullAddress = `${formData.address}, ${formData.city}, ${formData.state}`;
        const geocodeResult = await GeocodingService.geocodeAddress(
          fullAddress
        );

        if (
          !geocodeResult.success ||
          !geocodeResult.latitude ||
          !geocodeResult.longitude
        ) {
          setAddressError(
            geocodeResult.error ||
              "Could not verify the address. Please check and try again."
          );
          setIsSubmitting(false);
          return;
        }

        latitude = geocodeResult.latitude;
        longitude = geocodeResult.longitude;
      }

      const nearbyUniversities = getNearbyUniversities({
        lat: latitude,
        lng: longitude,
      });

      const newListing = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: "USA",
          latitude: latitude,
          longitude: longitude,
          nearbyUniversities,
          placeId: addressCoordinates.placeId, // Store Google Place ID for future reference
        },
        roomType: formData.roomType,
        amenities: selectedAmenities,
        images: images,
        availableFrom: new Date(formData.availableFrom),
        availableTo: formData.availableTo
          ? new Date(formData.availableTo)
          : undefined,
        maxOccupants: formData.maxOccupants,
        hostId: user.id,
        status: "active" as const,
        preferences: {
          gender: formData.gender,
          smokingAllowed: formData.smokingAllowed,
          petsAllowed: formData.petsAllowed,
          studyFriendly: formData.studyFriendly,
        },
        rules: rules.filter((rule) => rule.trim() !== ""),
        deposit: formData.deposit ? Number(formData.deposit) : undefined,
        utilities: {
          included: formData.utilitiesIncluded,
          cost: formData.utilitiesCost
            ? Number(formData.utilitiesCost)
            : undefined,
        },
      };

      await addListing(newListing);
      navigate("/browse");
    } catch (error) {
      setUploadError("Failed to create listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled =
    isSubmitting ||
    imageUploadInProgress ||
    images.length === 0 ||
    (!isSupabaseReady && images.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Listing
            </h1>
            <p className="text-gray-600 mt-2">
              Share your space with fellow students
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Home className="w-5 h-5" />
                <span>Basic Information</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Listing Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Cozy Studio Near Campus"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your space, neighborhood, and what makes it special..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Type
                  </label>
                  <select
                    name="roomType"
                    value={formData.roomType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {roomTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Occupants
                  </label>
                  <input
                    type="number"
                    name="maxOccupants"
                    min="1"
                    max="10"
                    value={formData.maxOccupants}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Location</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <FastAddressInput
                    value={formData.address}
                    onChange={(address: string) => {
                      setFormData((prev) => ({ ...prev, address }));
                      setAddressError("");
                    }}
                    onCityChange={(city: string) => {
                      setFormData((prev) => ({ ...prev, city }));
                    }}
                    onStateChange={(state: string) => {
                      setFormData((prev) => ({ ...prev, state }));
                    }}
                    onAddressSelect={(addressDetails: any) => {
                      setFormData((prev) => ({
                        ...prev,
                        address:
                          addressDetails.streetAddress ||
                          addressDetails.fullAddress,
                        city: addressDetails.city || prev.city,
                        state: addressDetails.state || prev.state,
                      }));
                      setAddressCoordinates({
                        latitude: addressDetails.latitude,
                        longitude: addressDetails.longitude,
                        placeId: addressDetails.placeId,
                      });
                      setAddressError("");
                    }}
                    error={addressError}
                    placeholder="Enter street address"
                    showCurrentLocation={true}
                    required={true}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="State"
                  />
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Photos</h2>
              <p className="text-sm text-gray-600">
                Upload high-quality photos of your space. The first image will
                be used as the cover photo.
              </p>

              <ImageUpload
                images={images}
                onImagesChange={setImages}
                uploadType="listing"
                maxImages={10}
                disabled={
                  isSubmitting || (!isSupabaseReady && images.length > 0)
                }
                realTimeUpload={true}
                onUploadStart={onImageUploadStart}
                onUploadComplete={onImageUploadComplete}
                onUploadError={onImageUploadError}
              />
              {imageUploadInProgress && (
                <div className="flex items-center space-x-2 text-sm text-blue-600 mt-2">
                  <AlertCircle className="w-4 h-4 animate-spin" />
                  <span>Uploading images... please wait.</span>
                </div>
              )}
              {uploadError && (
                <p className="text-red-600 text-sm flex items-center space-x-2 mt-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{uploadError}</span>
                </p>
              )}
              {!isSupabaseReady && images.length > 0 && (
                <div className="flex items-center space-x-2 text-yellow-700 text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>
                    Warning: Supabase is not configured. Images will only be
                    stored locally in your browser. They will NOT be saved
                    permanently or visible to other users if you submit.
                  </span>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Pricing</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Rent ($)
                  </label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Deposit ($)
                  </label>
                  <input
                    type="number"
                    name="deposit"
                    min="0"
                    value={formData.deposit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Utilities
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="utilitiesIncluded"
                        checked={formData.utilitiesIncluded}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Utilities included
                      </span>
                    </label>
                    {!formData.utilitiesIncluded && (
                      <input
                        type="number"
                        name="utilitiesCost"
                        min="0"
                        value={formData.utilitiesCost}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Monthly utilities cost"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Availability</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available From
                  </label>
                  <input
                    type="date"
                    name="availableFrom"
                    required
                    value={formData.availableFrom}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Until (Optional)
                  </label>
                  <input
                    type="date"
                    name="availableTo"
                    value={formData.availableTo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Amenities</h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {amenityOptions.map((amenity) => (
                  <label
                    key={amenity.value}
                    className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity.value)}
                      onChange={() => handleAmenityToggle(amenity.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {amenity.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Roommate Preferences</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="any">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="smokingAllowed"
                      checked={formData.smokingAllowed}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Smoking allowed
                    </span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="petsAllowed"
                      checked={formData.petsAllowed}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Pets allowed</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="studyFriendly"
                      checked={formData.studyFriendly}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Study-friendly environment
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* House Rules */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                House Rules
              </h2>

              <div className="space-y-3">
                {rules.map((rule, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={rule}
                      onChange={(e) => handleRuleChange(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., No parties after 10 PM"
                    />
                    {rules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRule(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addRule}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Add another rule</span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/browse")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Listing"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateListingPage;
