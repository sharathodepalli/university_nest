/**
 * Production-ready Address Service
 * Handles multiple geocoding providers with intelligent fallback
 */

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
  confidence?: number;
}

interface GeocodeOptions {
  provider?: 'google' | 'browser' | 'auto';
  timeout?: number;
  enableHighAccuracy?: boolean;
}

class ProductionAddressService {
  private static readonly GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  private static googleMapsLoaded = false;
  private static geocoderInstance: any = null;
  
  /**
   * Check if Google Maps is available and ready
   */
  static async isGoogleMapsAvailable(): Promise<boolean> {
    if (this.googleMapsLoaded && this.geocoderInstance) {
      return true;
    }

    try {
      if (window.google && window.google.maps && window.google.maps.Geocoder) {
        this.geocoderInstance = new window.google.maps.Geocoder();
        this.googleMapsLoaded = true;
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize Google Maps if not already loaded
   */
  static async initializeGoogleMaps(): Promise<boolean> {
    if (await this.isGoogleMapsAvailable()) {
      return true;
    }

    if (!this.GOOGLE_MAPS_API_KEY) {
      return false;
    }

    return new Promise((resolve) => {
      try {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${this.GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;

        const timeout = setTimeout(() => {
          resolve(false);
        }, 10000);

        script.onload = async () => {
          clearTimeout(timeout);
          // Wait for Google to be ready
          let attempts = 0;
          const checkReady = () => {
            attempts++;
            if (window.google && window.google.maps && window.google.maps.Geocoder) {
              this.geocoderInstance = new window.google.maps.Geocoder();
              this.googleMapsLoaded = true;
              resolve(true);
            } else if (attempts < 20) {
              setTimeout(checkReady, 100);
            } else {
              resolve(false);
            }
          };
          checkReady();
        };

        script.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };

        document.head.appendChild(script);
      } catch (error) {
        resolve(false);
      }
    });
  }

  /**
   * Get current location with enhanced error handling
   */
  static async getCurrentLocation(options: GeocodeOptions = {}): Promise<AddressDetails | null> {
    const { timeout = 15000, enableHighAccuracy = true } = options;

    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy,
            timeout,
            maximumAge: 300000, // 5 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // Try to get address from coordinates
      try {
        const address = await this.reverseGeocode(latitude, longitude, options);
        if (address) {
          address.latitude = latitude;
          address.longitude = longitude;
          return address;
        }
      } catch (error) {
      }

      // Fallback: return coordinates only
      return {
        fullAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        streetAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        city: '',
        state: '',
        zipCode: '',
        country: '',
        latitude,
        longitude,
        confidence: 0.5,
      };
    } catch (error: any) {
      let errorMessage = 'Error getting location: ';
      
      if (error.code === error.PERMISSION_DENIED) {
        errorMessage += 'Location access denied by user';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        errorMessage += 'Location information is unavailable';
      } else if (error.code === error.TIMEOUT) {
        errorMessage += 'Location request timed out';
      } else {
        errorMessage += error.message || 'Unknown error occurred';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  static async reverseGeocode(
    latitude: number,
    longitude: number,
    options: GeocodeOptions = {}
  ): Promise<AddressDetails | null> {
    const { provider = 'auto' } = options;

    // Try Google Maps first if available or requested
    if (provider === 'google' || provider === 'auto') {
      try {
        const googleResult = await this.reverseGeocodeGoogle(latitude, longitude);
        if (googleResult) {
          return googleResult;
        }
      } catch (error) {
        if (provider === 'google') {
          throw error;
        }
      }
    }

    // Fallback to browser-based or other services
    if (provider === 'browser' || provider === 'auto') {
      try {
        return await this.reverseGeocodeBrowser(latitude, longitude);
      } catch (error) {
        if (provider === 'browser') {
          throw error;
        }
      }
    }

    return null;
  }

  /**
   * Google Maps reverse geocoding
   */
  private static async reverseGeocodeGoogle(
    latitude: number,
    longitude: number
  ): Promise<AddressDetails | null> {
    if (!(await this.initializeGoogleMaps()) || !this.geocoderInstance) {
      throw new Error('Google Maps not available');
    }

    return new Promise((resolve, reject) => {
      const latlng = { lat: latitude, lng: longitude };

      this.geocoderInstance.geocode(
        { location: latlng },
        (results: any[], status: string) => {
          if (status === 'OK' && results && results.length > 0) {
            const place = results[0];
            const addressDetails = this.parseGooglePlaceDetails(place);
            addressDetails.latitude = latitude;
            addressDetails.longitude = longitude;
            addressDetails.confidence = 0.9;
            resolve(addressDetails);
          } else {
            reject(new Error(`Google geocoding failed: ${status}`));
          }
        }
      );
    });
  }

  /**
   * Browser-based reverse geocoding (fallback)
   */
  private static async reverseGeocodeBrowser(
    latitude: number,
    longitude: number
  ): Promise<AddressDetails | null> {
    // This is a simplified fallback - in a real production app,
    // you might use services like OpenStreetMap Nominatim, MapBox, etc.
    
    try {
      // Using a free reverse geocoding service (OpenStreetMap Nominatim)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'UniNest-Housing-Platform',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Nominatim API request failed');
      }

      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        return {
          fullAddress: data.display_name || '',
          streetAddress: `${addr.house_number || ''} ${addr.road || ''}`.trim(),
          city: addr.city || addr.town || addr.village || '',
          state: addr.state || '',
          zipCode: addr.postcode || '',
          country: addr.country || '',
          latitude,
          longitude,
          confidence: 0.7,
        };
      }
    } catch (error) {
    }

    return null;
  }

  /**
   * Forward geocoding - convert address to coordinates
   */
  static async geocodeAddress(address: string, options: GeocodeOptions = {}): Promise<AddressDetails | null> {
    const { provider = 'auto' } = options;

    // Try Google Maps first if available or requested
    if (provider === 'google' || provider === 'auto') {
      try {
        const googleResult = await this.geocodeAddressGoogle(address);
        if (googleResult) {
          return googleResult;
        }
      } catch (error) {
        if (provider === 'google') {
          throw error;
        }
      }
    }

    // Fallback to other services
    if (provider === 'browser' || provider === 'auto') {
      try {
        return await this.geocodeAddressBrowser(address);
      } catch (error) {
        if (provider === 'browser') {
          throw error;
        }
      }
    }

    return null;
  }

  /**
   * Google Maps forward geocoding
   */
  private static async geocodeAddressGoogle(address: string): Promise<AddressDetails | null> {
    if (!(await this.initializeGoogleMaps()) || !this.geocoderInstance) {
      throw new Error('Google Maps not available');
    }

    return new Promise((resolve, reject) => {
      this.geocoderInstance.geocode(
        { address },
        (results: any[], status: string) => {
          if (status === 'OK' && results && results.length > 0) {
            const place = results[0];
            const addressDetails = this.parseGooglePlaceDetails(place);
            addressDetails.confidence = 0.9;
            resolve(addressDetails);
          } else {
            reject(new Error(`Google geocoding failed: ${status}`));
          }
        }
      );
    });
  }

  /**
   * Browser-based forward geocoding (fallback)
   */
  private static async geocodeAddressBrowser(address: string): Promise<AddressDetails | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'UniNest-Housing-Platform',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Nominatim API request failed');
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const addr = result.address || {};
        
        return {
          fullAddress: result.display_name || address,
          streetAddress: `${addr.house_number || ''} ${addr.road || ''}`.trim(),
          city: addr.city || addr.town || addr.village || '',
          state: addr.state || '',
          zipCode: addr.postcode || '',
          country: addr.country || '',
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          confidence: 0.7,
        };
      }
    } catch (error) {
    }

    return null;
  }

  /**
   * Parse Google Place details into our standard format
   */
  private static parseGooglePlaceDetails(place: any): AddressDetails {
    const addressComponents = place.address_components || [];
    let streetNumber = '';
    let route = '';
    let city = '';
    let state = '';
    let zipCode = '';
    let country = '';

    addressComponents.forEach((component: any) => {
      const types = component.types;

      if (types.includes('street_number')) {
        streetNumber = component.long_name;
      } else if (types.includes('route')) {
        route = component.long_name;
      } else if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('sublocality') && !city) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      } else if (types.includes('postal_code')) {
        zipCode = component.long_name;
      } else if (types.includes('country')) {
        country = component.long_name;
      }
    });

    const streetAddress = `${streetNumber} ${route}`.trim();

    return {
      fullAddress: place.formatted_address || '',
      streetAddress,
      city,
      state,
      zipCode,
      country,
      latitude: place.geometry?.location?.lat(),
      longitude: place.geometry?.location?.lng(),
      placeId: place.place_id,
    };
  }

  /**
   * Health check for the service
   */
  static async healthCheck(): Promise<{
    googleMaps: boolean;
    geolocation: boolean;
    nominatim: boolean;
  }> {
    const results = {
      googleMaps: false,
      geolocation: false,
      nominatim: false,
    };

    // Check Google Maps
    try {
      results.googleMaps = await this.isGoogleMapsAvailable();
    } catch (error) {
    }

    // Check Geolocation
    results.geolocation = !!navigator.geolocation;

    // Check Nominatim
    try {
      const response = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=test&limit=1', {
        method: 'HEAD',
        headers: { 'User-Agent': 'UniNest-Housing-Platform' },
      });
      results.nominatim = response.ok;
    } catch (error) {
    }

    return results;
  }
}

export default ProductionAddressService;
