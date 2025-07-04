/**
 * Geocoding Service for Address Validation and Coordinate Lookup
 */

export interface GeocodeResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  error?: string;
  confidence?: number;
}

export interface AddressComponent {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

class GeocodingService {
  private static readonly GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  /**
   * Geocode an address using Google Maps Geocoding API
   * Falls back to OpenStreetMap if Google API key is not available
   */
  static async geocodeAddress(address: string): Promise<GeocodeResult> {
    if (!address || address.trim().length === 0) {
      return {
        success: false,
        error: 'Address is required'
      };
    }

    // Try Google Maps API first if API key is available
    if (this.GOOGLE_MAPS_API_KEY) {
      try {
        return await this.geocodeWithGoogle(address);
      } catch (error) {
        console.warn('Google geocoding failed, falling back to OpenStreetMap:', error);
      }
    }

    // Fallback to OpenStreetMap Nominatim (free)
    try {
      return await this.geocodeWithNominatim(address);
    } catch (error) {
      console.error('All geocoding services failed:', error);
      return {
        success: false,
        error: 'Unable to validate address. Please check the address and try again.'
      };
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
    if (this.GOOGLE_MAPS_API_KEY) {
      try {
        return await this.reverseGeocodeWithGoogle(latitude, longitude);
      } catch (error) {
        console.warn('Google reverse geocoding failed:', error);
      }
    }

    try {
      return await this.reverseGeocodeWithNominatim(latitude, longitude);
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return {
        success: false,
        error: 'Unable to get address for coordinates'
      };
    }
  }

  /**
   * Validate if an address is near a university (within 50 miles)
   */
  static async validateUniversityProximity(
    latitude: number, 
    longitude: number,
    maxDistanceMiles: number = 50
  ): Promise<{ isValid: boolean; nearestUniversity?: string; distance?: number }> {
    // University coordinates (major US universities)
    const universities = [
      { name: 'University of California, Berkeley', lat: 37.8719, lng: -122.2585 },
      { name: 'Stanford University', lat: 37.4275, lng: -122.1697 },
      { name: 'Harvard University', lat: 42.3744, lng: -71.1169 },
      { name: 'MIT', lat: 42.3601, lng: -71.0942 },
      { name: 'New York University', lat: 40.7295, lng: -73.9965 },
      { name: 'University of Southern California', lat: 34.0224, lng: -118.2851 },
      { name: 'UCLA', lat: 34.0689, lng: -118.4452 },
      { name: 'Columbia University', lat: 40.8075, lng: -73.9626 },
      { name: 'University of Chicago', lat: 41.7886, lng: -87.5987 },
      { name: 'University of Michigan', lat: 42.2780, lng: -83.7382 }
    ];

    let nearestUniversity = '';
    let minDistance = Infinity;

    for (const uni of universities) {
      const distance = this.calculateDistance(latitude, longitude, uni.lat, uni.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestUniversity = uni.name;
      }
    }

    return {
      isValid: minDistance <= maxDistanceMiles,
      nearestUniversity: minDistance <= maxDistanceMiles ? nearestUniversity : undefined,
      distance: minDistance
    };
  }

  /**
   * Google Maps Geocoding API
   */
  private static async geocodeWithGoogle(address: string): Promise<GeocodeResult> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;
      
      return {
        success: true,
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: result.formatted_address,
        confidence: this.calculateGoogleConfidence(result)
      };
    } else {
      return {
        success: false,
        error: data.status === 'ZERO_RESULTS' 
          ? 'Address not found. Please check and try again.'
          : `Geocoding failed: ${data.status}`
      };
    }
  }

  /**
   * OpenStreetMap Nominatim geocoding (free alternative)
   */
  private static async geocodeWithNominatim(address: string): Promise<GeocodeResult> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'UniNest-Housing-Platform/1.0'
      }
    });
    
    const data = await response.json();
    
    if (data.length > 0) {
      const result = data[0];
      return {
        success: true,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formattedAddress: result.display_name,
        confidence: parseFloat(result.importance || '0.5') * 100
      };
    } else {
      return {
        success: false,
        error: 'Address not found. Please check and try again.'
      };
    }
  }

  /**
   * Google reverse geocoding
   */
  private static async reverseGeocodeWithGoogle(latitude: number, longitude: number): Promise<GeocodeResult> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      
      return {
        success: true,
        latitude,
        longitude,
        formattedAddress: result.formatted_address,
        confidence: 95
      };
    } else {
      return {
        success: false,
        error: 'Unable to get address for coordinates'
      };
    }
  }

  /**
   * Nominatim reverse geocoding
   */
  private static async reverseGeocodeWithNominatim(latitude: number, longitude: number): Promise<GeocodeResult> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'UniNest-Housing-Platform/1.0'
      }
    });
    
    const data = await response.json();
    
    if (data.display_name) {
      return {
        success: true,
        latitude,
        longitude,
        formattedAddress: data.display_name,
        confidence: 80
      };
    } else {
      return {
        success: false,
        error: 'Unable to get address for coordinates'
      };
    }
  }

  /**
   * Calculate confidence score for Google results
   */
  private static calculateGoogleConfidence(result: any): number {
    if (result.geometry.location_type === 'ROOFTOP') return 95;
    if (result.geometry.location_type === 'RANGE_INTERPOLATED') return 85;
    if (result.geometry.location_type === 'GEOMETRIC_CENTER') return 75;
    return 60;
  }

  /**
   * Calculate distance using Haversine formula
   */
  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export default GeocodingService;
