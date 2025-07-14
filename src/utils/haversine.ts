/**
 * Haversine Distance Calculation Utility
 * Calculates the distance between two points on Earth using their latitude and longitude
 */

const EARTH_RADIUS_MILES = 3959;
const EARTH_RADIUS_KM = 6371;

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param lat1 - Latitude of first point in degrees
 * @param lon1 - Longitude of first point in degrees  
 * @param lat2 - Latitude of second point in degrees
 * @param lon2 - Longitude of second point in degrees
 * @param unit - Unit of measurement ('miles' | 'km')
 * @returns Distance in specified unit
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: 'miles' | 'km' = 'miles'
): number {
  // Validate input parameters
  if (
    typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' || typeof lon2 !== 'number'
  ) {
    return 0;
  }

  // Check for valid coordinate ranges
  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
    return 0;
  }

  if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
    return 0;
  }

  // Convert degrees to radians
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  // Apply Haversine formula
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Calculate distance
  const radius = unit === 'km' ? EARTH_RADIUS_KM : EARTH_RADIUS_MILES;
  return radius * c;
}

/**
 * Convert degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get formatted distance string with appropriate units
 * @param distance - Distance in miles
 * @returns Formatted string (e.g., "0.5 mi", "1,234 ft", "5.2 mi")
 */
export function formatDistance(distance: number): string {
  if (distance < 0.1) {
    const feet = Math.round(distance * 5280);
    return `${feet.toLocaleString()} ft`;
  } else if (distance < 1) {
    return `${distance.toFixed(1)} mi`;
  } else {
    return `${distance.toFixed(1)} mi`;
  }
}

/**
 * Calculate walking time estimate
 * @param distance - Distance in miles
 * @param walkingSpeedMph - Walking speed in miles per hour (default: 3 mph)
 * @returns Walking time in minutes
 */
export function calculateWalkingTime(distance: number, walkingSpeedMph: number = 3): number {
  return Math.round((distance / walkingSpeedMph) * 60);
}

/**
 * Get transportation mode suggestion based on distance
 * @param distance - Distance in miles
 * @returns Transportation mode and time estimate
 */
export function getTransportationMode(distance: number): {
  mode: 'walking' | 'biking' | 'driving' | 'transit';
  icon: string;
  time: string;
} {
  if (distance <= 0.5) {
    return {
      mode: 'walking',
      icon: '🚶‍♂️',
      time: `${calculateWalkingTime(distance)} min walk`
    };
  } else if (distance <= 2) {
    return {
      mode: 'biking',
      icon: '🚴‍♂️',
      time: `${Math.round(distance * 4)} min bike`
    };
  } else if (distance <= 10) {
    return {
      mode: 'driving',
      icon: '🚗',
      time: `${Math.round(distance * 2)} min drive`
    };
  } else {
    return {
      mode: 'transit',
      icon: '🚌',
      time: `${Math.round(distance * 3)} min transit`
    };
  }
}

export default calculateDistance;
