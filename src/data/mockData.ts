// src/data/mockData.ts
import { Listing, User } from '../types';
import RealAddressService from '../lib/realAddressService';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah.chen@berkeley.edu',
    university: 'University of California, Berkeley',
    year: 'Senior',
    bio: 'Engineering student, clean and organized. Love cooking and quiet study sessions.',
    verified: true,
    createdAt: new Date('2024-01-15'),
    phone: '+1 (555) 123-4567',
    preferences: {
      smokingAllowed: false,
      petsAllowed: true,
      studyFriendly: true,
      socialLevel: 'moderate',
      maxBudget: 1500,
      preferredRoomTypes: ['single', 'studio'],
      preferredAmenities: ['Wi-Fi', 'Laundry', 'Kitchen']
    },
    location: RealAddressService.REAL_UNIVERSITIES['University of California, Berkeley'],
    matchingPreferences: {
      maxDistance: 15,
      sameUniversity: true,
      similarYear: false,
      budgetRange: {
        min: 800,
        max: 1500
      }
    }
  },
  {
    id: '2',
    name: 'Marcus Rodriguez',
    email: 'marcus.r@stanford.edu',
    university: 'Stanford University',
    year: 'Graduate',
    bio: 'MBA student, loves cooking and hosting. Looking for responsible roommates.',
    verified: true,
    createdAt: new Date('2024-02-20'),
    phone: '+1 (555) 234-5678',
    preferences: {
      smokingAllowed: false,
      petsAllowed: true,
      studyFriendly: true,
      socialLevel: 'social',
      maxBudget: 2500,
      preferredRoomTypes: ['shared', 'apartment'],
      preferredAmenities: ['Wi-Fi', 'Kitchen', 'Parking', 'Gym Access']
    },
    location: {
      city: 'Palo Alto',
      state: 'California',
      country: 'USA',
      coordinates: {
        lat: 37.4419,
        lng: -122.1430
      }
    },
    matchingPreferences: {
      maxDistance: 20,
      sameUniversity: true,
      similarYear: false,
      budgetRange: {
        min: 1200,
        max: 2500
      }
    }
  },
  {
    id: '3',
    name: 'Emma Thompson',
    email: 'emma.t@ucla.edu',
    university: 'UCLA',
    year: 'Sophomore',
    bio: 'Art student seeking creative environment. Love plants and natural light.',
    verified: true,
    createdAt: new Date('2024-03-10'),
    phone: '+1 (555) 345-6789',
    preferences: {
      smokingAllowed: false,
      petsAllowed: false,
      studyFriendly: true,
      socialLevel: 'quiet',
      maxBudget: 1200,
      preferredRoomTypes: ['single'],
      preferredAmenities: ['Wi-Fi', 'Study Space', 'Common Area']
    },
    location: {
      city: 'Los Angeles',
      state: 'California',
      country: 'USA',
      coordinates: {
        lat: 34.0689,
        lng: -118.4452
      }
    },
    matchingPreferences: {
      maxDistance: 10,
      sameUniversity: true,
      similarYear: true,
      budgetRange: {
        min: 600,
        max: 1200
      }
    }
  },
];

export const mockListings: Listing[] = [
  {
    id: '1',
    title: 'Cozy Studio Near UC Berkeley Campus',
    description: 'Beautiful studio apartment just 5 minutes walk from UC Berkeley campus. Perfect for a graduate student who values quiet study time. Recently renovated with modern appliances and high-speed internet. The space features large windows with great natural light, perfect for studying or relaxing.',
    price: 1200,
    location: {
      address: '2536 Durant Ave, Berkeley, CA 94704',
      city: 'Berkeley',
      state: 'California',
      country: 'USA',
      latitude: 37.8688,
      longitude: -122.2595,
      // CORRECTED: nearbyUniversities now an array of objects
      nearbyUniversities: [{ name: 'University of California, Berkeley', distance: 0.2 }, { name: 'Berkeley City College', distance: 0.8 }],
    },
    roomType: 'studio',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Parking', 'Study Space', 'Air Conditioning'],
    images: [
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    availableFrom: new Date('2024-09-01'),
    availableTo: new Date('2025-05-31'),
    maxOccupants: 1,
    hostId: '1',
    host: mockUsers[0],
    createdAt: new Date('2024-08-15'),
    updatedAt: new Date('2024-08-15'),
    status: 'active',
    preferences: {
      gender: 'any',
      smokingAllowed: false,
      petsAllowed: false,
      studyFriendly: true,
    },
    rules: [
      'No smoking inside the apartment',
      'Quiet hours from 10 PM to 8 AM',
      'Keep common areas clean',
      'No overnight guests without prior notice'
    ],
    deposit: 1200,
    utilities: {
      included: true
    }
  },
  {
    id: '2',
    title: 'Shared Apartment Near Stanford',
    description: 'Looking for a responsible roommate to share this modern 2-bedroom apartment. Great for Stanford students! The apartment features a spacious living room, fully equipped kitchen, and in-unit laundry. Located in a quiet neighborhood with easy access to campus and downtown Palo Alto.',
    price: 1800,
    location: {
      address: '450 Cambridge Ave, Palo Alto, CA 94306',
      city: 'Palo Alto',
      state: 'California',
      country: 'USA',
      latitude: 37.4419,
      longitude: -122.1430,
      // CORRECTED: nearbyUniversities now an array of objects
      nearbyUniversities: [{ name: 'Stanford University', distance: 0.5 }],
    },
    roomType: 'shared',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Parking', 'Gym Access', 'Pool', 'Dishwasher'],
    images: [
      'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    availableFrom: new Date('2024-08-20'),
    maxOccupants: 2,
    hostId: '2',
    host: mockUsers[1],
    createdAt: new Date('2024-08-10'),
    updatedAt: new Date('2024-08-10'),
    status: 'active',
    preferences: {
      gender: 'any',
      smokingAllowed: false,
      petsAllowed: true,
      studyFriendly: true,
    },
    rules: [
      'Clean up after yourself in common areas',
      'Respect quiet hours during finals week',
      'Split utilities equally',
      'No parties without roommate approval'
    ],
    deposit: 1000,
    utilities: {
      included: false,
      cost: 150
    }
  },
  {
    id: '3',
    title: 'Single Room in Westwood Near UCLA',
    description: 'Private room in a shared house near UCLA. Perfect for undergrad students who want a social living experience. The house has a large common area, backyard, and is walking distance to campus. Great for students who want to be part of a friendly community.',
    price: 950,
    location: {
      address: '1045 Gayley Ave, Los Angeles, CA 90024',
      city: 'Los Angeles',
      state: 'California',
      country: 'USA',
      latitude: 34.0619,
      longitude: -118.4473,
      // CORRECTED: nearbyUniversities now an array of objects
      nearbyUniversities: [{ name: 'UCLA', distance: 0.7 }, { name: 'Santa Monica College', distance: 4.0 }],
    },
    roomType: 'single',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Common Area', 'Study Space', 'Furnished'],
    images: [
      'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    availableFrom: new Date('2024-09-15'),
    availableTo: new Date('2025-06-15'),
    maxOccupants: 1,
    hostId: '3',
    host: mockUsers[2],
    createdAt: new Date('2024-08-05'),
    updatedAt: new Date('2024-08-05'),
    status: 'active',
    preferences: {
      gender: 'female',
      smokingAllowed: false,
      petsAllowed: false,
      studyFriendly: true,
    },
    rules: [
      'Female students only',
      'No smoking anywhere on the property',
      'Keep noise levels reasonable',
      'Participate in house cleaning rotation'
    ],
    deposit: 500,
    utilities: {
      included: true
    }
  },
  {
    id: '4',
    title: 'Luxury Apartment Share in San Francisco',
    description: 'High-end apartment with amazing city views. Looking for a graduate student or young professional. This premium apartment features floor-to-ceiling windows, modern appliances, and access to building amenities including a rooftop terrace, gym, and concierge service.',
    price: 2200,
    location: {
      address: '100 Van Ness Ave, San Francisco, CA 94102',
      city: 'San Francisco',
      state: 'California',
      country: 'USA',
      latitude: 37.7749,
      longitude: -122.4194,
      // CORRECTED: nearbyUniversities now an array of objects
      nearbyUniversities: [
        { name: 'UC San Francisco', distance: 1.5 },
        { name: 'University of San Francisco', distance: 2.0 },
        { name: 'San Francisco State University', distance: 6.0 }
      ],
    },
    roomType: 'shared',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Parking', 'Gym Access', 'Pool', 'Concierge', 'Rooftop Terrace', 'Dishwasher', 'Air Conditioning'],
    images: [
      'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    availableFrom: new Date('2024-10-01'),
    maxOccupants: 2,
    hostId: '1',
    host: mockUsers[0],
    createdAt: new Date('2024-08-12'),
    updatedAt: new Date('2024-08-12'),
    status: 'active',
    preferences: {
      gender: 'any',
      smokingAllowed: false,
      petsAllowed: false,
      studyFriendly: true,
    },
    rules: [
      'Graduate students or professionals preferred',
      'Maintain apartment to high standards',
      'Respect building quiet hours',
      'No smoking in apartment or balcony'
    ],
    deposit: 2200,
    utilities: {
      included: true
    }
  },
  {
    id: '5',
    title: 'Modern Studio Near UC Berkeley',
    description: 'Brand new studio apartment perfect for UC Berkeley students. Features modern amenities, high-speed internet, and is within walking distance to campus. The building offers study lounges, fitness center, and 24/7 security.',
    price: 1400,
    location: {
      address: '2650 Bancroft Way, Berkeley, CA 94704',
      city: 'Berkeley',
      state: 'California',
      country: 'USA',
      latitude: 37.8697,
      longitude: -122.2601,
      // CORRECTED: nearbyUniversities now an array of objects
      nearbyUniversities: [{ name: 'University of California, Berkeley', distance: 0.3 }],
    },
    roomType: 'studio',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Gym Access', 'Study Space', 'Air Conditioning', 'Security'],
    images: [
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    availableFrom: new Date('2024-08-25'),
    availableTo: new Date('2025-05-31'),
    maxOccupants: 1,
    hostId: '2',
    host: mockUsers[1],
    createdAt: new Date('2024-08-20'),
    updatedAt: new Date('2024-08-20'),
    status: 'active',
    preferences: {
      gender: 'any',
      smokingAllowed: false,
      petsAllowed: false,
      studyFriendly: true,
    },
    rules: [
      'No smoking',
      'Quiet hours 10 PM - 8 AM',
      'No pets allowed',
      'Keep common areas clean'
    ],
    deposit: 1400,
    utilities: {
      included: true
    }
  },
  {
    id: '6',
    title: 'Shared House Near Stanford Campus',
    description: 'Looking for 2 roommates to share this beautiful 3-bedroom house near Stanford. Perfect for graduate students or professionals. The house features a large kitchen, living room, backyard, and parking. Great community atmosphere.',
    price: 1600,
    location: {
      address: '520 Mayfield Ave, Stanford, CA 94305',
      city: 'Stanford',
      state: 'California',
      country: 'USA',
      latitude: 37.4275,
      longitude: -122.1697,
      // CORRECTED: nearbyUniversities now an array of objects
      nearbyUniversities: [{ name: 'Stanford University', distance: 0.1 }],
    },
    roomType: 'shared',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Parking', 'Common Area', 'Backyard'],
    images: [
      'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    availableFrom: new Date('2024-09-01'),
    maxOccupants: 3,
    hostId: '3',
    host: mockUsers[2],
    createdAt: new Date('2024-08-18'),
    updatedAt: new Date('2024-08-18'),
    status: 'active',
    preferences: {
      gender: 'any',
      smokingAllowed: false,
      petsAllowed: true,
      studyFriendly: true,
    },
    rules: [
      'Graduate students preferred',
      'No smoking indoors',
      'Shared cleaning responsibilities',
      'Respect quiet study hours'
    ],
    deposit: 800,
    utilities: {
      included: false,
      cost: 100
    }
  },
  {
    id: '7',
    title: 'Modern Apartment near University of Cincinnati',
    description: 'Spacious and modern 2-bedroom apartment, perfect for students. Located just a short walk from the UC campus. Features a fully equipped kitchen, in-unit laundry, and a comfortable living area.',
    price: 1300,
    location: {
      address: '251 W McMillan St, Cincinnati, OH 45219',
      city: 'Cincinnati',
      state: 'Ohio',
      country: 'USA',
      latitude: 39.1293,
      longitude: -84.5184,
      // CORRECTED: nearbyUniversities now an array of objects
      nearbyUniversities: [{ name: 'University of Cincinnati', distance: 0.4 }],
    },
    roomType: 'apartment',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Air Conditioning', 'Dishwasher'],
    images: [
      'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    availableFrom: new Date('2024-08-01'),
    maxOccupants: 2,
    hostId: '3',
    host: mockUsers[2],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'active',
    preferences: {
      gender: 'any',
      smokingAllowed: false,
      petsAllowed: false,
      studyFriendly: true,
    },
    rules: [
      'No loud parties.',
      'Keep common areas clean.',
    ],
    deposit: 1000,
    utilities: {
      included: false,
      cost: 120,
    },
  },
];

export const amenityOptions = [
  { value: "Wi-Fi", label: "Wi-Fi" },
  { value: "Laundry", label: "Laundry" },
  { value: "Kitchen", label: "Kitchen" },
  { value: "Parking", label: "Parking" },
  { value: "Gym Access", label: "Gym Access" },
  { value: "Pool", label: "Pool" },
  { value: "Study Space", label: "Study Space" },
  { value: "Common Area", label: "Common Area" },
  { value: "Rooftop Terrace", label: "Rooftop Terrace" },
  { value: "Concierge", label: "Concierge" },
  { value: "Air Conditioning", label: "Air Conditioning" },
  { value: "Heating", label: "Heating" },
  { value: "Dishwasher", label: "Dishwasher" },
  { value: "Microwave", label: "Microwave" },
  { value: "Furnished", label: "Furnished" },
];

export const roomTypeOptions = [
  { value: "single", label: "Single Room" },
  { value: "shared", label: "Shared Room" },
  { value: "studio", label: "Studio" },
  { value: "apartment", label: "Full Apartment" },
];

export const universityOptions = [
  'University of California, Berkeley',
  'Stanford University',
  'UCLA',
  'USC',
  'UC San Diego',
  'UC San Francisco',
  'San Jose State University',
  'Santa Clara University',
  'UC Davis',
  'UC Irvine',
  'UC Santa Barbara',
  'UC Santa Cruz',
  'UC Riverside',
  'UC Merced',
  'California Institute of Technology',
  'Pepperdine University',
  'Loyola Marymount University',
  'Chapman University',
  'University of San Francisco',
  'San Francisco State University',
  'California State University, Long Beach',
  'California State University, Fullerton',
  'California State University, Northridge',
  'California State University, Los Angeles',
  'California Polytechnic State University',
  'Harvey Mudd College',
  'Pomona College',
  'Claremont McKenna College',
  'Scripps College',
  'Pitzer College',
];