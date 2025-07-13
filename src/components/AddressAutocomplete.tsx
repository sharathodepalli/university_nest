import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Locate, Search, Check, X } from "lucide-react";

interface AddressDetails {
  fullAddress: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

interface AddressSuggestion {
  description: string;
  placeId: string;
  types: string[];
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onAddressSelect?: (addressDetails: AddressDetails) => void;
  onCityChange?: (city: string) => void;
  onStateChange?: (state: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  showCurrentLocation?: boolean;
  restrictToCountry?: string; // ISO country code like 'US'
  types?: string[]; // e.g., ['address', 'establishment']
}

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onAddressSelect,
  onCityChange,
  onStateChange,
  placeholder = "Enter address",
  error,
  className = "",
  showCurrentLocation = true,
  restrictToCountry = "US",
  types = ["address"],
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Load Google Places API
  useEffect(() => {
    const loadGooglePlaces = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleLoaded(true);
        autocompleteService.current =
          new window.google.maps.places.AutocompleteService();
        // Create a div for PlacesService (required by Google)
        const dummyDiv = document.createElement("div");
        placesService.current = new window.google.maps.places.PlacesService(
          dummyDiv
        );
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com"]'
      );
      if (existingScript) {
        // Script exists but Google might not be ready yet
        const checkGoogleReady = () => {
          if (
            window.google &&
            window.google.maps &&
            window.google.maps.places
          ) {
            setIsGoogleLoaded(true);
            autocompleteService.current =
              new window.google.maps.places.AutocompleteService();
            const dummyDiv = document.createElement("div");
            placesService.current = new window.google.maps.places.PlacesService(
              dummyDiv
            );
          } else {
            setTimeout(checkGoogleReady, 100);
          }
        };
        checkGoogleReady();
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn("Google Maps API key not found");
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`;
      script.async = true;
      script.defer = true;

      // Add error handling for script loading
      script.onerror = () => {
        console.warn(
          "Failed to load Google Maps API - address autocomplete will use basic functionality"
        );
      };

      window.initGooglePlaces = () => {
        setIsGoogleLoaded(true);
        autocompleteService.current =
          new window.google.maps.places.AutocompleteService();
        // Create a div for PlacesService (required by Google)
        const dummyDiv = document.createElement("div");
        placesService.current = new window.google.maps.places.PlacesService(
          dummyDiv
        );
      };

      document.head.appendChild(script);
    };

    loadGooglePlaces();
  }, []);

  // Debounced search function
  const searchPlaces = useCallback(
    (query: string) => {
      if (!isGoogleLoaded || !autocompleteService.current || query.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);

      const request: any = {
        input: query,
        types: types,
      };

      // Add country restriction if specified
      if (restrictToCountry) {
        request.componentRestrictions = { country: restrictToCountry };
      }

      autocompleteService.current.getPlacePredictions(
        request,
        (predictions: any[], status: string) => {
          setIsLoading(false);

          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            const formattedSuggestions = predictions.map((prediction) => ({
              description: prediction.description,
              placeId: prediction.place_id,
              types: prediction.types,
            }));
            setSuggestions(formattedSuggestions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    },
    [isGoogleLoaded, types, restrictToCountry]
  );

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);

    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new debounce timer
    debounceTimer.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);
  };

  // Get place details when a suggestion is selected
  const selectSuggestion = async (suggestion: AddressSuggestion) => {
    if (!placesService.current) return;

    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);

    // Get detailed place information
    const request = {
      placeId: suggestion.placeId,
      fields: ["formatted_address", "address_components", "geometry", "name"],
    };

    placesService.current.getDetails(request, (place: any, status: string) => {
      if (
        status === window.google.maps.places.PlacesServiceStatus.OK &&
        place
      ) {
        const addressDetails = parseGooglePlaceDetails(place);

        if (onAddressSelect) {
          onAddressSelect(addressDetails);
        }

        if (onCityChange && addressDetails.city) {
          onCityChange(addressDetails.city);
        }

        if (onStateChange && addressDetails.state) {
          onStateChange(addressDetails.state);
        }
      }
    });
  };

  // Parse Google Place details into our format
  const parseGooglePlaceDetails = (place: any): AddressDetails => {
    const addressComponents = place.address_components || [];
    let streetNumber = "";
    let route = "";
    let city = "";
    let state = "";
    let zipCode = "";
    let country = "";

    addressComponents.forEach((component: any) => {
      const types = component.types;

      if (types.includes("street_number")) {
        streetNumber = component.long_name;
      } else if (types.includes("route")) {
        route = component.long_name;
      } else if (types.includes("locality") || types.includes("sublocality")) {
        city = component.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        state = component.short_name;
      } else if (types.includes("postal_code")) {
        zipCode = component.long_name;
      } else if (types.includes("country")) {
        country = component.long_name;
      }
    });

    const streetAddress = `${streetNumber} ${route}`.trim();

    return {
      fullAddress: place.formatted_address || "",
      streetAddress,
      city,
      state,
      zipCode,
      country,
      latitude: place.geometry?.location?.lat(),
      longitude: place.geometry?.location?.lng(),
      placeId: place.place_id,
    };
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // If Google Maps is available, use it for reverse geocoding
          if (isGoogleLoaded && window.google) {
            const geocoder = new window.google.maps.Geocoder();
            const latlng = { lat: latitude, lng: longitude };

            geocoder.geocode(
              { location: latlng },
              (results: any[], status: string) => {
                setIsGettingLocation(false);

                if (status === "OK" && results[0]) {
                  const place = results[0];
                  onChange(place.formatted_address);

                  const addressDetails = parseGooglePlaceDetails(place);
                  addressDetails.latitude = latitude;
                  addressDetails.longitude = longitude;

                  if (onAddressSelect) {
                    onAddressSelect(addressDetails);
                  }

                  if (onCityChange && addressDetails.city) {
                    onCityChange(addressDetails.city);
                  }

                  if (onStateChange && addressDetails.state) {
                    onStateChange(addressDetails.state);
                  }
                } else {
                  alert(
                    "Could not get address from your location. Please enter manually."
                  );
                }
              }
            );
          } else {
            // Fallback: Use a basic reverse geocoding service or just coordinates
            setIsGettingLocation(false);
            const coordinateString = `${latitude.toFixed(
              6
            )}, ${longitude.toFixed(6)}`;
            onChange(coordinateString);

            if (onAddressSelect) {
              onAddressSelect({
                fullAddress: coordinateString,
                streetAddress: coordinateString,
                city: "",
                state: "",
                zipCode: "",
                country: "",
                latitude,
                longitude,
              });
            }
          }
        } catch (error) {
          setIsGettingLocation(false);
          console.error("Error getting address from location:", error);
          alert(
            "Error getting address from your location. Please enter manually."
          );
        }
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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className={`w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            error ? "border-red-500 focus:ring-red-500" : ""
          }`}
          placeholder={placeholder}
          autoComplete="off"
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

        {isLoading && (
          <div className="absolute inset-y-0 right-8 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
          <X className="h-4 w-4" />
          {error}
        </p>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.placeId}
              type="button"
              onClick={() => selectSuggestion(suggestion)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                index === selectedIndex ? "bg-blue-50" : ""
              } ${index === 0 ? "rounded-t-lg" : ""} ${
                index === suggestions.length - 1 ? "rounded-b-lg" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-900 truncate">
                  {suggestion.description}
                </span>
                {index === selectedIndex && (
                  <Check className="h-4 w-4 text-blue-500 ml-auto flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Google API status */}
      {!isGoogleLoaded && (
        <p className="text-amber-600 text-sm mt-1 flex items-center gap-1">
          <Search className="h-4 w-4" />
          Loading address suggestions... (Note: Full autocomplete requires
          Google Maps API)
        </p>
      )}
    </div>
  );
};

export default AddressAutocomplete;
