import React, { useState, useEffect } from "react";
import AddressAutocomplete from "./AddressAutocomplete";
import BasicAddressInput from "./BasicAddressInput";

interface SmartAddressInputProps {
  address: string;
  city: string;
  state: string;
  onAddressChange: (address: string) => void;
  onCityChange: (city: string) => void;
  onStateChange: (state: string) => void;
  onAddressSelect?: (addressDetails: any) => void;
  addressError?: string;
  className?: string;
  placeholder?: string;
  showCurrentLocation?: boolean;
}

const SmartAddressInput: React.FC<SmartAddressInputProps> = ({
  address,
  city,
  state,
  onAddressChange,
  onCityChange,
  onStateChange,
  onAddressSelect,
  addressError,
  className = "",
  placeholder = "Enter address",
  showCurrentLocation = true,
}) => {
  const [useGoogleMaps, setUseGoogleMaps] = useState(true);
  const [googleMapsTimeout, setGoogleMapsTimeout] = useState(false);

  // Set a timeout to fallback to basic input if Google Maps doesn't load
  useEffect(() => {
    const timeout = setTimeout(() => {
      setGoogleMapsTimeout(true);
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.log(
          "Google Maps API timeout - falling back to basic address input"
        );
        setUseGoogleMaps(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, []);

  // Listen for CSP errors and fallback
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message && event.message.includes("Content Security Policy")) {
        console.log(
          "CSP blocked Google Maps - falling back to basic address input"
        );
        setUseGoogleMaps(false);
      }
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  // If we're using Google Maps and it hasn't timed out yet, show the autocomplete
  if (useGoogleMaps && !googleMapsTimeout) {
    return (
      <AddressAutocomplete
        value={address}
        onChange={onAddressChange}
        onAddressSelect={onAddressSelect}
        onCityChange={onCityChange}
        onStateChange={onStateChange}
        error={addressError}
        placeholder={placeholder}
        className={className}
        showCurrentLocation={showCurrentLocation}
        restrictToCountry="US"
        types={["address"]}
      />
    );
  }

  // Fallback to basic input
  return (
    <div className={className}>
      <BasicAddressInput
        address={address}
        city={city}
        state={state}
        onAddressChange={onAddressChange}
        onCityChange={onCityChange}
        onStateChange={onStateChange}
        addressError={addressError}
        showCurrentLocation={showCurrentLocation}
      />

      {googleMapsTimeout && (
        <p className="text-blue-600 text-sm mt-2">
          💡 Using simplified address input. For enhanced address suggestions,
          ensure Google Maps API is properly configured.
        </p>
      )}
    </div>
  );
};

export default SmartAddressInput;
