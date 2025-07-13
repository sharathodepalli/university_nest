import React from "react";
import { MapPin, Locate, X } from "lucide-react";

interface BasicAddressInputProps {
  address: string;
  city: string;
  state: string;
  onAddressChange: (address: string) => void;
  onCityChange: (city: string) => void;
  onStateChange: (state: string) => void;
  addressError?: string;
  className?: string;
  showCurrentLocation?: boolean;
}

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

const BasicAddressInput: React.FC<BasicAddressInputProps> = ({
  address,
  city,
  state,
  onAddressChange,
  onCityChange,
  onStateChange,
  addressError,
  className = "",
  showCurrentLocation = false,
}) => {
  const [isGettingLocation, setIsGettingLocation] = React.useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGettingLocation(false);
        const { latitude, longitude } = position.coords;

        // Set coordinates as address for now
        onAddressChange(
          `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
        );

        // Try to get approximate location based on coordinates (you could enhance this)
        // For now, just alert the user to enter details manually
        alert(
          `Location detected (${latitude.toFixed(4)}, ${longitude.toFixed(
            4
          )}). Please enter your address details manually.`
        );
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = "Error getting your location: ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Location access denied by user.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Street Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Street Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            className={`w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              addressError ? "border-red-500 focus:ring-red-500" : ""
            }`}
            placeholder="Enter street address"
          />

          {showCurrentLocation && (
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50"
              title="Use current location"
            >
              {isGettingLocation ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              ) : (
                <Locate className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        {addressError && (
          <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
            <X className="h-4 w-4" />
            {addressError}
          </p>
        )}
      </div>

      {/* City and State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter city"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State
          </label>
          <select
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select state</option>
            {US_STATES.map((stateName) => (
              <option key={stateName} value={stateName}>
                {stateName}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default BasicAddressInput;
