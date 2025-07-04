/**
 * Real Address Integration for Mock Data
 * Updates existing mock listings with real addresses
 */

import { Listing } from '../types';
import RealAddressService, { RealAddress } from '../lib/realAddressService';
import { getUniversityByName } from '../data/universities';
import { calculateDistance } from '../utils/haversine';

export const updateListingsWithRealAddresses = (existingListings: Listing[]): Listing[] => {
  const realAddresses = RealAddressService.REAL_HOUSING_ADDRESSES;
  
  return existingListings.map((listing, index) => {
    // Get a real address from our database
    const realAddress = realAddresses[index % realAddresses.length];
    
    if (!realAddress) return listing;

    const nearbyUniversitiesWithDistance = realAddress.nearbyUniversities.map(uniName => {
      const university = getUniversityByName(uniName);
      if (!university) {
        return { name: uniName, distance: Infinity };
      }
      const distance = calculateDistance(
        realAddress.coordinates.lat,
        realAddress.coordinates.lng,
        university.coordinates.lat,
        university.coordinates.lng
      );
      return { name: uniName, distance };
    }).sort((a, b) => a.distance - b.distance);

    const nearestUniversityDistance = nearbyUniversitiesWithDistance[0]?.distance || Infinity;
    
    return {
      ...listing,
      location: {
        address: realAddress.formattedAddress,
        city: realAddress.city,
        state: realAddress.state,
        country: realAddress.country,
        latitude: realAddress.coordinates.lat,
        longitude: realAddress.coordinates.lng,
        nearbyUniversities: nearbyUniversitiesWithDistance,
      },
      title: updateTitleWithRealLocation(listing.title, realAddress),
      description: updateDescriptionWithRealInfo(listing.description, realAddress, nearestUniversityDistance)
    };
  });
};

const updateTitleWithRealLocation = (originalTitle: string, address: RealAddress): string => {
  const universityName = address.nearbyUniversities[0];
  const shortUniversityName = getShortUniversityName(universityName);
  
  // Update title to include real location
  if (originalTitle.includes('Near Campus') || originalTitle.includes('UC Berkeley')) {
    return originalTitle.replace(/Near (UC Berkeley )?Campus?/i, `Near ${shortUniversityName}`);
  }
  
  return `${originalTitle} - ${address.city}`;
};

const updateDescriptionWithRealInfo = (
  originalDescription: string, 
  address: RealAddress, 
  distance: number
): string => {
  const universityName = address.nearbyUniversities[0];
  const shortUniversityName = getShortUniversityName(universityName);
  
  // Add real distance information
  const distanceText = distance < 1 
    ? `Just ${(distance * 5280).toFixed(0)} feet` 
    : `${distance.toFixed(1)} miles`;
    
  const realLocationInfo = `Located at ${address.formattedAddress}. ${distanceText} from ${shortUniversityName} campus.`;
  
  // Replace generic distance mentions with real ones
  let updatedDescription = originalDescription
    .replace(/just \d+ minutes? walk/i, `${distanceText} walk`)
    .replace(/\d+\.\d+ miles?/i, `${distance.toFixed(1)} miles`)
    .replace(/walking distance/i, distance < 1 ? 'walking distance' : 'short commute');
  
  // Add real location info at the end
  return `${updatedDescription} ${realLocationInfo}`;
};

const getShortUniversityName = (fullName: string): string => {
  const shortNames: Record<string, string> = {
    'University of California, Berkeley': 'UC Berkeley',
    'Stanford University': 'Stanford',
    'Harvard University': 'Harvard', 
    'Massachusetts Institute of Technology': 'MIT',
    'New York University': 'NYU',
    'University of Southern California': 'USC'
  };
  
  return shortNames[fullName] || fullName;
};

/**
 * Add real address validation to listing creation
 */
export const validateListingAddress = async (listing: Partial<Listing>): Promise<{
  isValid: boolean;
  validatedAddress?: RealAddress;
  errors: string[];
}> => {
  const errors: string[] = [];
  
  if (!listing.location) {
    errors.push('Location is required');
    return { isValid: false, errors };
  }

  const location = listing.location as any; // Use any to handle the complex union type
  
  // If it's already a location with latitude/longitude, validate coordinates
  if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
    const isValid = location.latitude !== 0 && location.longitude !== 0;
    if (!isValid) {
      errors.push('Invalid or missing coordinates');
    }
    
    // Convert to RealAddress format for further validation if needed
    const realAddress: RealAddress = {
      street: location.address || '',
      city: location.city || '',
      state: location.state || '',
      zipCode: '', // We don't have zipCode in the new interface
      country: location.country || 'USA',
      coordinates: {
        lat: location.latitude,
        lng: location.longitude
      },
      formattedAddress: location.address || '',
      nearbyUniversities: location.nearbyUniversities || []
    };
    
    const addressValid = await RealAddressService.validateAddress(realAddress);
    if (!addressValid) {
      errors.push('Address is too far from any university');
    }
    
    return { 
      isValid: isValid && addressValid, 
      validatedAddress: (isValid && addressValid) ? realAddress : undefined,
      errors 
    };
  }
  
  // If it's a string address (for geocoding), we need to handle this case
  if (typeof location.address === 'string' && !location.latitude) {
    try {
      // Use our geocoding service
      const GeocodingService = (await import('../utils/geocoding')).default;
      const geocodeResult = await GeocodingService.geocodeAddress(location.address);
      
      if (!geocodeResult.success) {
        errors.push(geocodeResult.error || 'Could not find the specified address');
        return { isValid: false, errors };
      }
      
      if (!geocodeResult.latitude || !geocodeResult.longitude) {
        errors.push('Could not get coordinates for address');
        return { isValid: false, errors };
      }
      
      if ((geocodeResult.confidence || 0) < 70) {
        errors.push('Address location is not precise enough');
      }
      
      const realAddress: RealAddress = {
        street: location.address,
        city: location.city || '',
        state: location.state || '',
        zipCode: '',
        country: location.country || 'USA',
        coordinates: {
          lat: geocodeResult.latitude,
          lng: geocodeResult.longitude
        },
        formattedAddress: geocodeResult.formattedAddress || location.address,
        nearbyUniversities: []
      };
      
      const isValid = await RealAddressService.validateAddress(realAddress);
      if (!isValid) {
        errors.push('Address is too far from any university');
      }
      
      return {
        isValid: isValid && (geocodeResult.confidence || 0) >= 70,
        validatedAddress: realAddress,
        errors
      };
    } catch (error) {
      errors.push('Failed to validate address');
      return { isValid: false, errors };
    }
  }
  
  errors.push('Invalid location format');
  return { isValid: false, errors };
};

export default { updateListingsWithRealAddresses, validateListingAddress };
