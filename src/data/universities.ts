import { UniversityData } from '../types';
import { calculateDistance } from '../utils/haversine';

export const universityData: UniversityData[] = [
  {
    id: 'uc-berkeley',
    name: 'UC Berkeley',
    city: 'Berkeley',
    state: 'California',
    country: 'USA',
    coordinates: { lat: 37.8719, lng: -122.2585 },
    studentCount: 45000,
    popularAreas: ['Berkeley', 'Oakland', 'Albany', 'El Cerrito'],
    averageRent: {
      single: 1200,
      shared: 800,
      studio: 1800,
      apartment: 2500
    }
  },
  {
    id: 'stanford',
    name: 'Stanford University',
    city: 'Stanford',
    state: 'California',
    country: 'USA',
    coordinates: { lat: 37.4275, lng: -122.1697 },
    studentCount: 17000,
    popularAreas: ['Palo Alto', 'Stanford', 'Menlo Park', 'Mountain View'],
    averageRent: {
      single: 1800,
      shared: 1200,
      studio: 2500,
      apartment: 3500
    }
  },
  {
    id: 'ucla',
    name: 'UCLA',
    city: 'Los Angeles',
    state: 'California',
    country: 'USA',
    coordinates: { lat: 34.0689, lng: -118.4452 },
    studentCount: 47000,
    popularAreas: ['Westwood', 'Santa Monica', 'Brentwood', 'West LA'],
    averageRent: {
      single: 1000,
      shared: 700,
      studio: 1600,
      apartment: 2200
    }
  },
  {
    id: 'usc',
    name: 'USC',
    city: 'Los Angeles',
    state: 'California',
    country: 'USA',
    coordinates: { lat: 34.0224, lng: -118.2851 },
    studentCount: 48000,
    popularAreas: ['University Park', 'Downtown LA', 'Koreatown', 'Mid-City'],
    averageRent: {
      single: 950,
      shared: 650,
      studio: 1500,
      apartment: 2000
    }
  },
  {
    id: 'ucsd',
    name: 'UC San Diego',
    city: 'San Diego',
    state: 'California',
    country: 'USA',
    coordinates: { lat: 32.8801, lng: -117.2340 },
    studentCount: 39000,
    popularAreas: ['La Jolla', 'Pacific Beach', 'Mission Beach', 'Clairemont'],
    averageRent: {
      single: 900,
      shared: 600,
      studio: 1400,
      apartment: 1900
    }
  }
];

export const getUniversityByName = (name: string): UniversityData | undefined => {
  return universityData.find(uni => uni.name === name);
};

export const getUniversitiesByCity = (city: string): UniversityData[] => {
  return universityData.filter(uni => uni.city.toLowerCase() === city.toLowerCase());
};

export const getNearbyUniversities = (
  center: { lat: number; lng: number },
  radiusMiles: number = 50
): { name: string; distance: number }[] => {
  // Ensure center coordinates are valid before attempting calculation
  if (center.lat === undefined || center.lng === undefined || (center.lat === 0 && center.lng === 0)) {
    return []; // Return empty array if center is invalid/0,0
  }

  return universityData
    .map(uni => {
      // Ensure university coordinates are valid before calculating distance
      if (uni.coordinates.lat === undefined || uni.coordinates.lng === undefined || (uni.coordinates.lat === 0 && uni.coordinates.lng === 0)) {
        return { name: uni.name, distance: Infinity }; // Treat as infinitely far if uni coords are invalid
      }
      const distance = calculateDistance(
        center.lat,
        center.lng,
        uni.coordinates.lat,
        uni.coordinates.lng
      );
      return { name: uni.name, distance };
    })
    .filter(uni => uni.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance);
};