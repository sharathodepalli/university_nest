import React, { Suspense, lazy } from "react";
import { MapPin } from "lucide-react";

// Lazy load address components to reduce initial bundle size
const ProductionAddressInput = lazy(() => import("./ProductionAddressInput"));
const EnhancedAddressInput = lazy(() => import("./EnhancedAddressInput"));

interface LazyAddressInputProps {
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
  required?: boolean;
  autoUpgrade?: boolean;
  mode?: "production" | "enhanced" | "auto";
}

const LoadingFallback: React.FC<{ placeholder?: string }> = ({
  placeholder = "Enter your address",
}) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <MapPin className="h-5 w-5 text-gray-400" />
    </div>
    <input
      type="text"
      disabled
      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
      placeholder={`Loading ${placeholder.toLowerCase()}...`}
    />
    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
    </div>
  </div>
);

const LazyAddressInput: React.FC<LazyAddressInputProps> = ({
  mode = "production",
  placeholder,
  address,
  onAddressChange,
  ...props
}) => {
  if (mode === "enhanced") {
    return (
      <Suspense fallback={<LoadingFallback placeholder={placeholder} />}>
        <EnhancedAddressInput
          value={address}
          onChange={onAddressChange}
          placeholder={placeholder}
          {...props}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingFallback placeholder={placeholder} />}>
      <ProductionAddressInput
        address={address}
        onAddressChange={onAddressChange}
        placeholder={placeholder}
        {...props}
      />
    </Suspense>
  );
};

export default LazyAddressInput;
