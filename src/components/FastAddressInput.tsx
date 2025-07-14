import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Locate, Search, Check, X, Zap } from "lucide-react";
import { googleMapsLoader } from "../lib/googleMapsLoader";

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
  isCurrentLocation?: boolean;
  distance?: number;
}

interface FastAddressInputProps {
  value: string;
  onChange: (address: string) => void;
  onAddressSelect?: (addressDetails: AddressDetails) => void;
  onCityChange?: (city: string) => void;
  onStateChange?: (state: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  showCurrentLocation?: boolean;
  restrictToCountry?: string;
  required?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

const FastAddressInput: React.FC<FastAddressInputProps> = ({
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
  required = false,
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<AddressSuggestion[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Load Google Maps API using centralized loader
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        const isLoaded = await googleMapsLoader.loadGoogleMaps({
          libraries: ["places"],
          timeout: 3000,
        });

        if (isLoaded && window.google?.maps?.places) {
          setIsGoogleLoaded(true);
          autocompleteService.current =
            new window.google.maps.places.AutocompleteService();
          const dummyDiv = document.createElement("div");
          placesService.current = new window.google.maps.places.PlacesService(
            dummyDiv
          );
        }
      } catch (error) {
        // Google Maps loading failed - continue without Places API
      }
    };

    loadGoogleMaps();
  }, []);

  // Enhanced search function with location bias and shorter query support
  const searchPlaces = useCallback(
    (query: string) => {
      // Start searching with just 2 characters
      if (
        !query.trim() ||
        query.length < 2 ||
        !isGoogleLoaded ||
        !autocompleteService.current
      ) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);

      const request: any = {
        input: query,
        types: ["address"],
      };

      if (restrictToCountry) {
        request.componentRestrictions = { country: restrictToCountry };
      }

      // Add location bias if user location is available
      if (userLocation) {
        request.location = new window.google.maps.LatLng(
          userLocation.lat,
          userLocation.lng
        );
        request.radius = 50000; // 50km radius for nearby suggestions
      }

      autocompleteService.current.getPlacePredictions(
        request,
        (predictions: any[], status: string) => {
          setIsLoading(false);

          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            const formattedSuggestions = predictions
              .slice(0, 8) // Show more suggestions
              .map((prediction) => ({
                description: prediction.description,
                placeId: prediction.place_id,
                types: prediction.types,
                distance: prediction.distance_meters || 0,
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
    [isGoogleLoaded, restrictToCountry, userLocation]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 100); // Faster debounce for quicker response
  };

  const selectSuggestion = async (suggestion: AddressSuggestion) => {
    if (!placesService.current) return;

    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);

    const request = {
      placeId: suggestion.placeId,
      fields: ["formatted_address", "address_components", "geometry"],
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
      } else if (types.includes("locality")) {
        city = component.long_name;
      } else if (types.includes("sublocality") && !city) {
        // Fallback to sublocality if no locality found
        city = component.long_name;
      } else if (types.includes("administrative_area_level_3") && !city) {
        // Another fallback for city
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

  // Get nearby places for location dropdown
  const getNearbyPlaces = useCallback(
    async (lat: number, lng: number) => {
      if (!isGoogleLoaded || !window.google || !placesService.current) return;

      const location = new window.google.maps.LatLng(lat, lng);
      const request = {
        location: location,
        radius: 5000, // 5km radius
        types: ["establishment", "point_of_interest", "university", "school"],
      };

      return new Promise<AddressSuggestion[]>((resolve) => {
        placesService.current.nearbySearch(
          request,
          (results: any[], status: string) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              results
            ) {
              const nearbyOptions = results.slice(0, 5).map((place) => ({
                description: `${place.name} - ${place.vicinity}`,
                placeId: place.place_id,
                types: place.types || [],
                distance: 0,
              }));
              resolve(nearbyOptions);
            } else {
              resolve([]);
            }
          }
        );
      });
    },
    [isGoogleLoaded]
  );

  // Enhanced location button click handler
  const handleLocationClick = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    // If we already have suggestions, just show the dropdown
    if (nearbyPlaces.length > 0) {
      setShowLocationDropdown(!showLocationDropdown);
      return;
    }

    setIsGettingLocation(true);
    setShowLocationDropdown(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        try {
          if (isGoogleLoaded && window.google) {
            // Get current address
            const geocoder = new window.google.maps.Geocoder();
            const latlng = { lat: latitude, lng: longitude };

            geocoder.geocode(
              { location: latlng },
              async (results: any[], status: string) => {
                setIsGettingLocation(false);

                if (status === "OK" && results[0]) {
                  const currentPlace = results[0];

                  // Get nearby places
                  const nearby = await getNearbyPlaces(latitude, longitude);

                  // Create suggestions with current location first
                  const locationSuggestions: AddressSuggestion[] = [
                    {
                      description: `📍 Current Location: ${currentPlace.formatted_address}`,
                      placeId: currentPlace.place_id,
                      types: ["current_location"],
                      isCurrentLocation: true,
                      distance: 0,
                    },
                    ...(nearby || []),
                  ];

                  setNearbyPlaces(locationSuggestions);
                  setShowLocationDropdown(true);
                }
              }
            );
          } else {
            setIsGettingLocation(false);
            // Fallback to coordinates if Google Maps not loaded
            const coordinateString = `${latitude.toFixed(
              6
            )}, ${longitude.toFixed(6)}`;
            onChange(coordinateString);
          }
        } catch (error) {
          setIsGettingLocation(false);
        }
      },
      () => {
        setIsGettingLocation(false);
        alert(
          "Unable to get your location. Please check your browser permissions."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const selectLocationOption = async (suggestion: AddressSuggestion) => {
    if (suggestion.isCurrentLocation && userLocation) {
      // For current location, we need to get detailed address components
      if (!placesService.current) return;

      onChange(suggestion.description.replace("📍 Current Location: ", ""));
      setShowLocationDropdown(false);

      // Get detailed address components for current location
      if (suggestion.placeId) {
        const request = {
          placeId: suggestion.placeId,
          fields: ["formatted_address", "address_components", "geometry"],
        };

        placesService.current.getDetails(
          request,
          (place: any, status: string) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              place
            ) {
              const addressDetails = parseGooglePlaceDetails(place);
              addressDetails.latitude = userLocation.lat;
              addressDetails.longitude = userLocation.lng;

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
              // Fallback if place details fail
              const basicAddressDetails: AddressDetails = {
                fullAddress: suggestion.description.replace(
                  "📍 Current Location: ",
                  ""
                ),
                streetAddress: "",
                city: "",
                state: "",
                zipCode: "",
                country: "",
                latitude: userLocation.lat,
                longitude: userLocation.lng,
                placeId: suggestion.placeId,
              };

              if (onAddressSelect) {
                onAddressSelect(basicAddressDetails);
              }
            }
          }
        );
      }
    } else {
      // For other places, get full details
      await selectSuggestion(suggestion);
      setShowLocationDropdown(false);
    }
  };

  const getCurrentLocation = () => {
    handleLocationClick();
  };

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
        setShowLocationDropdown(false);
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
            // Close location dropdown when focusing on input
            setShowLocationDropdown(false);
          }}
          className={`w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
            error ? "border-red-500 focus:ring-red-500" : ""
          } ${required ? "required" : ""}`}
          placeholder={placeholder}
          autoComplete="off"
          required={required}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {/* Loading indicator */}
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
          )}

          {/* Speed indicator */}
          {isGoogleLoaded && !isLoading && (
            <div title="Fast mode enabled">
              <Zap className="h-4 w-4 text-green-500" />
            </div>
          )}

          {/* Current location button */}
          {showCurrentLocation && (
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className={`text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50 ${
                showLocationDropdown ? "text-blue-500" : ""
              }`}
              title={
                nearbyPlaces.length > 0
                  ? "Show location options"
                  : "Get current location"
              }
            >
              {isGettingLocation ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
              ) : (
                <Locate className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
          <X className="h-4 w-4" />
          {error}
        </p>
      )}

      {/* Location options dropdown */}
      {showLocationDropdown && nearbyPlaces.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
            <p className="text-sm font-medium text-gray-700">
              Location Options
            </p>
          </div>
          {nearbyPlaces.map((option, index) => (
            <button
              key={option.placeId || index}
              type="button"
              onClick={() => selectLocationOption(option)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 ${
                index === nearbyPlaces.length - 1 ? "rounded-b-lg" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                {option.isCurrentLocation ? (
                  <Locate className="h-4 w-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
                <span className="text-gray-900 truncate text-sm">
                  {option.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Suggestions dropdown with lightning-fast animations */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-150"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.placeId}
              type="button"
              onClick={() => selectSuggestion(suggestion)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 ${
                index === selectedIndex ? "bg-blue-50" : ""
              } ${index === 0 ? "rounded-t-lg" : ""} ${
                index === suggestions.length - 1 ? "rounded-b-lg" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-gray-900 truncate block">
                    {suggestion.description}
                  </span>
                  {suggestion.distance && suggestion.distance > 0 && (
                    <span className="text-xs text-gray-500">
                      ~{Math.round(suggestion.distance / 1000)}km away
                    </span>
                  )}
                </div>
                {index === selectedIndex && (
                  <Check className="h-4 w-4 text-blue-500 ml-auto flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Status indicator */}
      {!isGoogleLoaded && (
        <p className="text-amber-600 text-sm mt-1 flex items-center gap-1">
          <Search className="h-4 w-4" />
          Loading fast address suggestions...
        </p>
      )}
    </div>
  );
};

export default FastAddressInput;
