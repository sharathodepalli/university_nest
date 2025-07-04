import React, { useState, useEffect } from "react";
import { MapPin, Target, School, Navigation } from "lucide-react";
import { useListings } from "../contexts/ListingsContext";
import { calculateDistance } from "../utils/haversine";
import { UniversityData as UniversityType, Listing } from "../types";
import { universityData } from "../data/universities";

type ListingWithDistance = Listing & { distance: number };

const AddressDemo: React.FC = () => {
  const { listings } = useListings();
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityType>(
    universityData[0]
  );
  const [nearbyListings, setNearbyListings] = useState<ListingWithDistance[]>(
    []
  );
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (selectedUniversity) {
      const listingsWithDistance: ListingWithDistance[] = listings.map(
        (listing) => ({
          ...listing,
          distance: calculateDistance(
            selectedUniversity.coordinates.lat,
            selectedUniversity.coordinates.lng,
            listing.location.latitude,
            listing.location.longitude
          ),
        })
      );

      // Filter listings within a certain radius, e.g., 10 miles
      const filteredListings = listingsWithDistance
        .filter((listing) => listing.distance <= 10)
        .sort((a, b) => a.distance - b.distance);

      setNearbyListings(filteredListings);
    }
  }, [selectedUniversity, listings]);

  const getDistance = (listing: ListingWithDistance) => {
    if (userLocation) {
      return calculateDistance(
        userLocation.lat,
        userLocation.lng,
        listing.location.latitude,
        listing.location.longitude
      );
    }
    return listing.distance;
  };

  const handleGetUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert(
            "Could not get your location. Please enable location services."
          );
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleUniversityChange = (universityName: string) => {
    const university = universityData.find((u) => u.name === universityName);
    if (university) {
      setSelectedUniversity(university);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          <span>🌍 Real Address & Distance Calculator</span>
        </h2>

        {/* University Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select University:
          </label>
          <select
            value={selectedUniversity.name}
            onChange={(e) => handleUniversityChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {universityData.map((uni) => (
              <option key={uni.name} value={uni.name}>
                {uni.name}
              </option>
            ))}
          </select>
        </div>

        {/* User Location */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Target className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Your Location
              </h3>
              <p className="text-sm text-gray-500">
                {userLocation
                  ? `Lat: ${userLocation.lat.toFixed(
                      4
                    )}, Lng: ${userLocation.lng.toFixed(4)}`
                  : "Click the button to get your current location."}
              </p>
            </div>
          </div>
          <button
            onClick={handleGetUserLocation}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center space-x-2"
          >
            <Navigation className="w-5 h-5" />
            <span>Get My Location</span>
          </button>
        </div>

        {/* Nearby Listings */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <School className="w-6 h-6 text-purple-600" />
            <span>
              Listings Near: <strong>{selectedUniversity.name}</strong>
            </span>
          </h3>
          <div className="space-y-4">
            {nearbyListings.length > 0 ? (
              nearbyListings.map((listing) => (
                <div
                  key={listing.id}
                  className="p-4 border border-gray-200 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {listing.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {listing.location.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">
                      {getDistance(listing).toFixed(2)} miles
                    </p>
                    <p className="text-xs text-gray-500">
                      {userLocation ? "from you" : "from university"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">
                No listings found within 10 miles of {selectedUniversity.name}.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressDemo;
