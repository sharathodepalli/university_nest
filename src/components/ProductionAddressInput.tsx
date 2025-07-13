import React, { useState, useEffect, useCallback } from "react";
import EnhancedAddressInput from "./EnhancedAddressInput";
import BasicAddressInput from "./BasicAddressInput";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

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

interface ProductionAddressInputProps {
  address: string;
  city: string;
  state: string;
  onAddressChange: (address: string) => void;
  onCityChange: (city: string) => void;
  onStateChange: (state: string) => void;
  onAddressSelect?: (addressDetails: AddressDetails) => void;
  addressError?: string;
  className?: string;
  placeholder?: string;
  showCurrentLocation?: boolean;
  required?: boolean;
  autoUpgrade?: boolean; // Try to upgrade to enhanced mode when possible
}

type AddressMode = "enhanced" | "basic" | "checking";

const ProductionAddressInput: React.FC<ProductionAddressInputProps> = ({
  address,
  city,
  state,
  onAddressChange,
  onCityChange,
  onStateChange,
  onAddressSelect,
  addressError,
  className = "",
  placeholder = "Enter your address",
  showCurrentLocation = true,
  required = false,
  autoUpgrade = true,
}) => {
  const [mode, setMode] = useState<AddressMode>("checking");
  const [upgradeAttempts, setUpgradeAttempts] = useState(0);
  const [lastUpgradeCheck, setLastUpgradeCheck] = useState<number>(0);
  const [showModeInfo, setShowModeInfo] = useState(false);

  // Check for Google Maps availability
  const checkGoogleMapsAvailability = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      // Check if already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        resolve(true);
        return;
      }

      // Check if script exists and might load
      const script = document.querySelector(
        'script[src*="maps.googleapis.com"]'
      );
      if (script) {
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (
            window.google &&
            window.google.maps &&
            window.google.maps.places
          ) {
            clearInterval(checkInterval);
            resolve(true);
          } else if (attempts > 20) {
            // 10 seconds max wait
            clearInterval(checkInterval);
            resolve(false);
          }
        }, 500);
      } else {
        // Try to load the script
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          resolve(false);
          return;
        }

        try {
          const newScript = document.createElement("script");
          newScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          newScript.async = true;
          newScript.defer = true;

          const timeout = setTimeout(() => {
            resolve(false);
          }, 8000);

          newScript.onload = () => {
            clearTimeout(timeout);
            // Wait a bit for Google to initialize
            setTimeout(() => {
              resolve(
                window.google && window.google.maps && window.google.maps.places
              );
            }, 500);
          };

          newScript.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
          };

          document.head.appendChild(newScript);
        } catch (error) {
          resolve(false);
        }
      }
    });
  }, []);

  // Initialize mode
  useEffect(() => {
    const initializeMode = async () => {
      setMode("checking");

      const isAvailable = await checkGoogleMapsAvailability();
      setMode(isAvailable ? "enhanced" : "basic");

      if (!isAvailable) {
        setShowModeInfo(true);
        setTimeout(() => setShowModeInfo(false), 5000);
      }
    };

    initializeMode();
  }, [checkGoogleMapsAvailability]);

  // Auto-upgrade mechanism
  useEffect(() => {
    if (!autoUpgrade || mode === "enhanced" || upgradeAttempts >= 3) return;

    const now = Date.now();
    if (now - lastUpgradeCheck < 30000) return; // Don't check more than once per 30 seconds

    const attemptUpgrade = async () => {
      setLastUpgradeCheck(now);
      setUpgradeAttempts((prev) => prev + 1);

      const isAvailable = await checkGoogleMapsAvailability();
      if (isAvailable) {
        setMode("enhanced");
        setShowModeInfo(true);
        setTimeout(() => setShowModeInfo(false), 3000);
      }
    };

    const upgradeTimer = setTimeout(
      attemptUpgrade,
      5000 + upgradeAttempts * 10000
    );
    return () => clearTimeout(upgradeTimer);
  }, [
    mode,
    autoUpgrade,
    upgradeAttempts,
    lastUpgradeCheck,
    checkGoogleMapsAvailability,
  ]);

  const handleManualUpgrade = async () => {
    setMode("checking");
    const isAvailable = await checkGoogleMapsAvailability();
    setMode(isAvailable ? "enhanced" : "basic");

    if (isAvailable) {
      setUpgradeAttempts(0); // Reset attempts on successful manual upgrade
    }
  };

  const handleEnhancedAddressSelect = (addressDetails: AddressDetails) => {
    if (onAddressSelect) {
      onAddressSelect(addressDetails);
    }
    // Also update individual fields for compatibility
    if (addressDetails.city && addressDetails.city !== city) {
      onCityChange(addressDetails.city);
    }
    if (addressDetails.state && addressDetails.state !== state) {
      onStateChange(addressDetails.state);
    }
  };

  const renderModeIndicator = () => {
    if (!showModeInfo && mode !== "checking") return null;

    const getIndicatorContent = () => {
      switch (mode) {
        case "checking":
          return {
            icon: (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
            ),
            text: "Checking address suggestions...",
            className: "text-blue-600 bg-blue-50 border-blue-200",
          };
        case "enhanced":
          return {
            icon: <CheckCircle className="h-4 w-4" />,
            text: "Enhanced address suggestions enabled",
            className: "text-green-600 bg-green-50 border-green-200",
          };
        case "basic":
          return {
            icon: <AlertTriangle className="h-4 w-4" />,
            text: "Using basic address input - enhanced suggestions unavailable",
            className: "text-yellow-600 bg-yellow-50 border-yellow-200",
          };
      }
    };

    const { icon, text, className } = getIndicatorContent();

    return (
      <div
        className={`flex items-center gap-2 p-2 rounded-md border text-sm mb-2 ${className}`}
      >
        {icon}
        <span className="flex-1">{text}</span>
        {mode === "basic" && upgradeAttempts < 3 && (
          <button
            onClick={handleManualUpgrade}
            className="text-xs px-2 py-1 rounded bg-white border hover:bg-gray-50 transition-colors"
            title="Try to enable enhanced mode"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  };

  if (mode === "checking") {
    return (
      <div className={className}>
        {renderModeIndicator()}
        <div className="relative">
          <input
            type="text"
            value={address}
            disabled
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
            placeholder="Loading address input..."
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {renderModeIndicator()}

      {mode === "enhanced" ? (
        <EnhancedAddressInput
          value={address}
          onChange={onAddressChange}
          onAddressSelect={handleEnhancedAddressSelect}
          onCityChange={onCityChange}
          onStateChange={onStateChange}
          placeholder={placeholder}
          error={addressError}
          showCurrentLocation={showCurrentLocation}
          required={required}
        />
      ) : (
        <BasicAddressInput
          address={address}
          city={city}
          state={state}
          onAddressChange={onAddressChange}
          onCityChange={onCityChange}
          onStateChange={onStateChange}
          onAddressSelect={onAddressSelect}
          addressError={addressError}
          showCurrentLocation={showCurrentLocation}
          required={required}
        />
      )}

      {mode === "basic" && (
        <p className="text-xs text-gray-500 mt-1">
          💡 Enhanced address suggestions will automatically enable when
          available
        </p>
      )}
    </div>
  );
};

export default ProductionAddressInput;
