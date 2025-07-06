export interface User {
  id: string;
  name: string;
  email: string;
  university: string;
  year: string;
  bio: string;
  profilePicture?: string;
  verified: boolean;
  createdAt: Date;
  phone?: string;
  preferences?: {
    smokingAllowed: boolean;
    petsAllowed: boolean;
    studyFriendly: boolean;
    socialLevel: 'quiet' | 'moderate' | 'social';
    maxBudget?: number;
    preferredRoomTypes?: string[];
    preferredAmenities?: string[];
  };
  location?: {
    address: string; // ADDED THIS LINE
    city: string;
    state: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  matchingPreferences?: {
    maxDistance: number; // in miles
    sameUniversity: boolean;
    similarYear: boolean;
    budgetRange: {
      min: number;
      max: number;
    };
  };
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
    nearbyUniversities: { name: string; distance: number }[];
  };
  roomType: 'single' | 'shared' | 'studio' | 'apartment';
  amenities: string[];
  images: string[];
  availableFrom: Date;
  availableTo?: Date;
  maxOccupants: number;
  hostId: string;
  host: User;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive' | 'rented';
  preferences: {
    gender?: 'male' | 'female' | 'any';
    smokingAllowed: boolean;
    petsAllowed: boolean;
    studyFriendly: boolean;
    ageRange?: {
      min: number;
      max: number;
    };
    yearPreference?: string[];
  };
  rules?: string[];
  deposit?: number;
  utilities?: {
    included: boolean;
    cost?: number;
  };
  matchScore?: number; // Calculated based on user preferences
  relevanceScore?: number; // Based on location, university, etc.
}

export interface SearchFilters {
  query?: string;
  location?: string;
  university?: string | { custom: string };
  maxDistance?: number;
  priceRange?: { min?: number; max?: number };
  roomType?: string[];
  amenities?: string[];
  moveInDate?: string;
  availableFrom?: Date;
  sortBy?: 'relevance' | 'price' | 'date';
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  listingId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'image' | 'system';
}

export interface Conversation {
  id: string;
  participants: User[];
  listing: Listing;
  messages: Message[];
  lastMessage: Message;
  updatedAt: Date;
  unreadCount: number;
}

export interface MatchingCriteria {
  university: string;
  location: {
    city: string;
    state: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  maxDistance: number;
  budgetRange: {
    min: number;
    max: number;
  };
  preferences: {
    roomTypes: string[];
    amenities: string[];
    lifestyle: {
      smokingAllowed: boolean;
      petsAllowed: boolean;
      studyFriendly: boolean;
      socialLevel: 'quiet' | 'moderate' | 'social';
    };
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'listing_inquiry' | 'listing_update' | 'system' | 'new_match';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  metadata?: any;
}

export interface UniversityData {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  studentCount: number;
  popularAreas: string[];
  averageRent: {
    single: number;
    shared: number;
    studio: number;
    apartment: number;
  };
}