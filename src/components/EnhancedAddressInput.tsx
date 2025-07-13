import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin,
  Locate,
  Search,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

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
  structuredFormatting?: {
    mainText: string;
    secondaryText: string;
  };
}

interface EnhancedAddressInputProps {
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
  types?: string[];
  required?: boolean;
}

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

type LoadingState =
  | "idle"
  | "loading-api"
  | "loading-suggestions"
  | "loading-location"
  | "api-failed";

const EnhancedAddressInput: React.FC<EnhancedAddressInputProps> = ({
  value,
  onChange,
  onAddressSelect,
  onCityChange,
  onStateChange,
  placeholder = "Enter your address",
  error,
  className = "",
  showCurrentLocation = true,
  restrictToCountry = "US",
  types = ["address"],
  required = false,
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [apiLoadAttempts, setApiLoadAttempts] = useState(0);
  const [userMessage, setUserMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "info" | "warning" | "success" | "error"
  >("info");

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const loadingTimeout = useRef<NodeJS.Timeout>();

  // Enhanced Google Places API loading with retry mechanism
  const loadGooglePlaces = useCallback(async () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsGoogleLoaded(true);
      setLoadingState("idle");
      setUserMessage("Address suggestions enabled");
      setMessageType("success");
      autocompleteService.current =
        new window.google.maps.places.AutocompleteService();
      const dummyDiv = document.createElement("div");
      placesService.current = new window.google.maps.places.PlacesService(
        dummyDiv
      );
      return;
    }

    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    if (existingScript && apiLoadAttempts === 0) {
      // Script exists, wait for it to load
      setLoadingState("loading-api");
      setUserMessage("Loading address suggestions...");
      setMessageType("info");

      const checkGoogleReady = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsGoogleLoaded(true);
          setLoadingState("idle");
          setUserMessage("Address suggestions enabled");
          setMessageType("success");
          autocompleteService.current =
            new window.google.maps.places.AutocompleteService();
          const dummyDiv = document.createElement("div");
          placesService.current = new window.google.maps.places.PlacesService(
            dummyDiv
          );
        } else if (apiLoadAttempts < 3) {
          setTimeout(checkGoogleReady, 500);
        } else {
          handleApiFailure();
        }
      };
      checkGoogleReady();
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      handleApiFailure("Google Maps API key not configured");
      return;
    }

    if (apiLoadAttempts >= 3) {
      handleApiFailure("Failed to load after multiple attempts");
      return;
    }

    setApiLoadAttempts((prev) => prev + 1);
    setLoadingState("loading-api");
    setUserMessage("Loading address suggestions...");
    setMessageType("info");

    try {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`;
      script.async = true;
      script.defer = true;

      // Set up timeout for script loading
      loadingTimeout.current = setTimeout(() => {
        handleApiFailure("Maps API loading timeout");
      }, 10000);

      script.onerror = () => {
        if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
        handleApiFailure("Failed to load Google Maps script");
      };

      window.initGooglePlaces = () => {
        if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
        setIsGoogleLoaded(true);
        setLoadingState("idle");
        setUserMessage("Address suggestions enabled");
        setMessageType("success");
        autocompleteService.current =
          new window.google.maps.places.AutocompleteService();
        const dummyDiv = document.createElement("div");
        placesService.current = new window.google.maps.places.PlacesService(
          dummyDiv
        );

        // Clear message after 3 seconds
        setTimeout(() => setUserMessage(""), 3000);
      };

      document.head.appendChild(script);
    } catch (error) {
      handleApiFailure("Script injection failed");
    }
  }, [apiLoadAttempts]);

  const handleApiFailure = (reason?: string) => {
    if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
    setLoadingState("api-failed");
    setIsGoogleLoaded(false);
    setUserMessage(
      reason || "Address suggestions unavailable - manual entry available"
    );
    setMessageType("warning");

    // Clear warning after 5 seconds
    setTimeout(() => setUserMessage(""), 5000);
  };

  const retryApiLoad = () => {
    setApiLoadAttempts(0);
    setLoadingState("idle");
    setUserMessage("");
    loadGooglePlaces();
  };

  useEffect(() => {
    loadGooglePlaces();

    return () => {
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [loadGooglePlaces]);

  // Enhanced search with better error handling
  const searchPlaces = useCallback(
    (query: string) => {
      if (!isGoogleLoaded || !autocompleteService.current || query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoadingState("loading-suggestions");

      const request: any = {
        input: query,
        types: types,
      };

      if (restrictToCountry) {
        request.componentRestrictions = { country: restrictToCountry };
      }

      autocompleteService.current.getPlacePredictions(
        request,
        (predictions: any[], status: string) => {
          setLoadingState("idle");

          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            const formattedSuggestions = predictions.map((prediction) => ({
              description: prediction.description,
              placeId: prediction.place_id,
              types: prediction.types,
              structuredFormatting: prediction.structured_formatting,
            }));
            setSuggestions(formattedSuggestions);
            setShowSuggestions(true);
          } else if (
            status ===
            window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS
          ) {
            setSuggestions([]);
            setShowSuggestions(false);
            setUserMessage("No suggestions found for this address");
            setMessageType("info");
            setTimeout(() => setUserMessage(""), 3000);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
            console.warn("Places API error:", status);
          }
        }
      );
    },
    [isGoogleLoaded, types, restrictToCountry]
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
    }, 300);
  };

  const selectSuggestion = async (suggestion: AddressSuggestion) => {
    if (!placesService.current) return;

    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);

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

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setUserMessage("Geolocation is not supported by this browser");
      setMessageType("error");
      setTimeout(() => setUserMessage(""), 5000);
      return;
    }

    setLoadingState("loading-location");
    setUserMessage("Getting your location...");
    setMessageType("info");

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000,
          });
        }
      );

      const { latitude, longitude } = position.coords;

      if (isGoogleLoaded && window.google) {
        const geocoder = new window.google.maps.Geocoder();
        const latlng = { lat: latitude, lng: longitude };

        geocoder.geocode(
          { location: latlng },
          (results: any[], status: string) => {
            setLoadingState("idle");

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

              setUserMessage("Location detected successfully");
              setMessageType("success");
              setTimeout(() => setUserMessage(""), 3000);
            } else {
              throw new Error("Could not get address from location");
            }
          }
        );
      } else {
        // Fallback: Use coordinates
        setLoadingState("idle");
        const coordinateString = `${latitude.toFixed(6)}, ${longitude.toFixed(
          6
        )}`;
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

        setUserMessage("Location coordinates captured");
        setMessageType("success");
        setTimeout(() => setUserMessage(""), 3000);
      }
    } catch (error: any) {
      setLoadingState("idle");
      let errorMessage = "Error getting location: ";

      if (error.code === error.PERMISSION_DENIED) {
        errorMessage += "Location access denied";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        errorMessage += "Location unavailable";
      } else if (error.code === error.TIMEOUT) {
        errorMessage += "Location request timed out";
      } else {
        errorMessage += "Unknown error occurred";
      }

      setUserMessage(errorMessage);
      setMessageType("error");
      setTimeout(() => setUserMessage(""), 5000);
    }
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

  const getStatusIcon = () => {
    switch (loadingState) {
      case "loading-api":
      case "loading-suggestions":
      case "loading-location":
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
        );
      case "api-failed":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return isGoogleLoaded ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <Search className="h-4 w-4 text-gray-400" />
        );
    }
  };

  const getMessageIcon = () => {
    switch (messageType) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Search className="h-4 w-4 text-blue-500" />;
    }
  };

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
          className={`w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            error ? "border-red-500 focus:ring-red-500" : ""
          } ${required ? "required" : ""}`}
          placeholder={placeholder}
          autoComplete="off"
          required={required}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {/* Status indicator */}
          <div
            title={
              isGoogleLoaded
                ? "Address suggestions active"
                : loadingState === "api-failed"
                ? "Suggestions unavailable"
                : "Loading..."
            }
          >
            {getStatusIcon()}
          </div>

          {/* Retry button for failed API */}
          {loadingState === "api-failed" && (
            <button
              type="button"
              onClick={retryApiLoad}
              className="text-gray-400 hover:text-blue-500 transition-colors"
              title="Retry loading address suggestions"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}

          {/* Current location button */}
          {showCurrentLocation && (
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={loadingState === "loading-location"}
              className="text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50"
              title="Use current location"
            >
              {loadingState === "loading-location" ? (
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
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      {/* User message */}
      {userMessage && (
        <p
          className={`text-sm mt-1 flex items-center gap-1 ${
            messageType === "success"
              ? "text-green-600"
              : messageType === "warning"
              ? "text-yellow-600"
              : messageType === "error"
              ? "text-red-600"
              : "text-blue-600"
          }`}
        >
          {getMessageIcon()}
          {userMessage}
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
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  {suggestion.structuredFormatting ? (
                    <>
                      <div className="text-gray-900 font-medium truncate">
                        {suggestion.structuredFormatting.mainText}
                      </div>
                      <div className="text-gray-500 text-sm truncate">
                        {suggestion.structuredFormatting.secondaryText}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-900 truncate">
                      {suggestion.description}
                    </div>
                  )}
                </div>
                {index === selectedIndex && (
                  <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedAddressInput;
