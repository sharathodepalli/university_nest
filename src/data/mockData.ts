// src/data/mockData.ts
import { Listing, User } from '../types';
import RealAddressService from '../lib/realAddressService';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah.chen@berkeley.edu',
    university: 'University of California, Berkeley',
    year: 'PhD Candidate',
    bio: 'Bioengineering PhD student researching tissue engineering. Clean, organized, and respectful roommate. Love cooking healthy meals and quiet study sessions. Non-smoker, occasionally social but prioritize academics. Looking for like-minded graduate students who value a peaceful living environment.',
    verified: true,
    createdAt: new Date('2024-01-15'),
    phone: '+1 (510) 555-0123',
    preferences: {
      smokingAllowed: false,
      petsAllowed: true,
      studyFriendly: true,
      socialLevel: 'moderate',
      maxBudget: 2000,
      preferredRoomTypes: ['single', 'studio'],
      preferredAmenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Study Space', 'Gym Access']
    },
    location: {
      address: RealAddressService.REAL_UNIVERSITIES['University of California, Berkeley'].formattedAddress,
      city: RealAddressService.REAL_UNIVERSITIES['University of California, Berkeley'].city,
      state: RealAddressService.REAL_UNIVERSITIES['University of California, Berkeley'].state,
      country: RealAddressService.REAL_UNIVERSITIES['University of California, Berkeley'].country,
      coordinates: RealAddressService.REAL_UNIVERSITIES['University of California, Berkeley'].coordinates
    },
    matchingPreferences: {
      maxDistance: 15,
      sameUniversity: true,
      similarYear: false,
      budgetRange: {
        min: 1200,
        max: 2000
      }
    }
  },
  {
    id: '2',
    name: 'Marcus Rodriguez',
    email: 'marcus.r@stanford.edu',
    university: 'Stanford University',
    year: 'MBA Student',
    bio: 'Stanford MBA student focusing on sustainable technology ventures. Professional background in consulting. Love cooking, hosting dinner parties, and weekend hiking. Seeking responsible, career-focused roommates who enjoy good conversation and occasional social gatherings. Fluent in Spanish and English.',
    verified: true,
    createdAt: new Date('2024-02-20'),
    phone: '+1 (650) 555-0234',
    preferences: {
      smokingAllowed: false,
      petsAllowed: true,
      studyFriendly: true,
      socialLevel: 'social',
      maxBudget: 3000,
      preferredRoomTypes: ['shared', 'apartment'],
      preferredAmenities: ['Wi-Fi', 'Kitchen', 'Parking', 'Gym Access', 'Pool', 'Common Area']
    },
    location: {
      address: '450 Jane Stanford Way, Stanford, CA 94305, USA',
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
        min: 1800,
        max: 3000
      }
    }
  },
  {
    id: '3',
    name: 'Emma Thompson',
    email: 'emma.t@ucla.edu',
    university: 'UCLA',
    year: 'Junior',
    bio: 'Art History major with a minor in Museum Studies. Creative, organized, and respectful. Love visiting museums, reading, and maintaining plants. Prefer quiet environments for studying but enjoy occasional movie nights. Looking for female roommates who share similar interests in arts and culture.',
    verified: true,
    createdAt: new Date('2024-03-10'),
    phone: '+1 (310) 555-0345',
    preferences: {
      smokingAllowed: false,
      petsAllowed: false,
      studyFriendly: true,
      socialLevel: 'quiet',
      maxBudget: 1400,
      preferredRoomTypes: ['single'],
      preferredAmenities: ['Wi-Fi', 'Study Space', 'Common Area', 'Natural Light']
    },
    location: {
      address: '405 Hilgard Ave, Los Angeles, CA 90024, USA',
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
        min: 800,
        max: 1400
      }
    }
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'd.kim@nyu.edu',
    university: 'New York University',
    year: 'Graduate',
    bio: 'Computer Science MS student specializing in machine learning. International student from South Korea. Quiet, clean, and dedicated to studies. Enjoy exploring NYC food scene and weekend photography walks. Looking for graduate student roommates who understand the demands of rigorous academic programs.',
    verified: true,
    createdAt: new Date('2024-04-05'),
    phone: '+1 (212) 555-0456',
    preferences: {
      smokingAllowed: false,
      petsAllowed: false,
      studyFriendly: true,
      socialLevel: 'moderate',
      maxBudget: 2500,
      preferredRoomTypes: ['studio', 'shared'],
      preferredAmenities: ['Wi-Fi', 'Security', 'Laundry', 'Study Space']
    },
    location: {
      address: '4 Washington Square N, New York, NY 10003, USA',
      city: 'New York',
      state: 'New York',
      country: 'USA',
      coordinates: {
        lat: 40.7308,
        lng: -73.9973
      }
    },
    matchingPreferences: {
      maxDistance: 5,
      sameUniversity: true,
      similarYear: false,
      budgetRange: {
        min: 1800,
        max: 2500
      }
    }
  },
  {
    id: '5',
    name: 'Jessica Martinez',
    email: 'j.martinez@utexas.edu',
    university: 'University of Texas at Austin',
    year: 'Senior',
    bio: 'Journalism major and student newspaper editor. Bilingual English/Spanish speaker. Active in campus organizations and volunteer work. Love live music (this is Austin!), writing, and trying new restaurants. Seeking roommates who are social but respectful of study time during finals.',
    verified: true,
    createdAt: new Date('2024-05-12'),
    phone: '+1 (512) 555-0567',
    preferences: {
      smokingAllowed: false,
      petsAllowed: true,
      studyFriendly: true,
      socialLevel: 'social',
      maxBudget: 1000,
      preferredRoomTypes: ['shared'],
      preferredAmenities: ['Wi-Fi', 'Kitchen', 'Common Area', 'Pool']
    },
    location: {
      address: '110 Inner Campus Dr, Austin, TX 78705, USA',
      city: 'Austin',
      state: 'Texas',
      country: 'USA',
      coordinates: {
        lat: 30.2849,
        lng: -97.7341
      }
    },
    matchingPreferences: {
      maxDistance: 8,
      sameUniversity: true,
      similarYear: true,
      budgetRange: {
        min: 600,
        max: 1000
      }
    }
  },
  {
    id: '6',
    name: 'Alex Johnson',
    email: 'a.johnson@umich.edu',
    university: 'University of Michigan',
    year: 'Graduate',
    bio: 'Environmental Engineering PhD student researching water treatment systems. Midwest native who loves college sports, board games, and craft beer. Easy-going roommate who enjoys both quiet study time and social activities. Looking for graduate students who appreciate work-life balance.',
    verified: true,
    createdAt: new Date('2024-06-18'),
    phone: '+1 (734) 555-0678',
    preferences: {
      smokingAllowed: false,
      petsAllowed: true,
      studyFriendly: true,
      socialLevel: 'moderate',
      maxBudget: 900,
      preferredRoomTypes: ['single', 'shared'],
      preferredAmenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Common Area']
    },
    location: {
      address: '500 S State St, Ann Arbor, MI 48109, USA',
      city: 'Ann Arbor',
      state: 'Michigan',
      country: 'USA',
      coordinates: {
        lat: 42.2762,
        lng: -83.7389
      }
    },
    matchingPreferences: {
      maxDistance: 12,
      sameUniversity: true,
      similarYear: false,
      budgetRange: {
        min: 500,
        max: 900
      }
    }
  },
];

export const mockListings: Listing[] = [
  // Berkeley - Premium Studio
  {
    id: '1',
    title: 'Premium Studio Near UC Berkeley - Perfect for Graduate Students',
    description: 'Stunning newly renovated studio apartment just 3 blocks from UC Berkeley campus. This modern space features a Murphy bed, built-in desk area, full kitchen with stainless steel appliances, and a spa-like bathroom. Large windows provide abundant natural light and partial Bay views. Building amenities include a fitness center, study lounge, and rooftop deck. Ideal for serious graduate students who value quality living and academic focus. Walking distance to campus libraries, labs, and the vibrant Telegraph Avenue scene.',
    price: 1850,
    location: {
      address: '2536 Durant Ave, Berkeley, CA 94704',
      city: 'Berkeley',
      state: 'California',
      country: 'USA',
      latitude: 37.8688,
      longitude: -122.2595,
      nearbyUniversities: [{ name: 'University of California, Berkeley', distance: 0.2 }, { name: 'Berkeley City College', distance: 0.8 }],
    },
    roomType: 'studio',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Parking', 'Study Space', 'Air Conditioning', 'Gym Access', 'Rooftop Terrace', 'Dishwasher', 'Security'],
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    ],
    availableFrom: new Date('2025-01-15'),
    availableTo: new Date('2025-12-31'),
    maxOccupants: 1,
    hostId: '1',
    host: mockUsers[0],
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-15'),
    status: 'active',
    preferences: {
      gender: 'any',
      smokingAllowed: false,
      petsAllowed: false,
      studyFriendly: true,
    },
    rules: [
      'No smoking anywhere on property',
      'Quiet hours from 10 PM to 8 AM strictly enforced',
      'Professional references required for lease',
      'No subletting without written permission',
      'Building study lounge available 24/7'
    ],
    deposit: 2775,
    utilities: {
      included: true
    }
  },
  // Stanford - Luxury Shared Apartment
  {
    id: '2',
    title: 'Luxury 2BR Apartment Near Stanford - Seeking Responsible Graduate Student',
    description: 'Exceptional opportunity to share a high-end 2-bedroom apartment in prestigious Palo Alto location, just 0.5 miles from Stanford campus. This modern unit features floor-to-ceiling windows, premium appliances, quartz countertops, and an in-unit washer/dryer. Building amenities include a resort-style pool, state-of-the-art fitness center, business center, and underground parking. Your private bedroom includes a walk-in closet and en-suite bathroom. Perfect for PhD students, postdocs, or MBA candidates who appreciate refined living. Current roommate is a quiet Stanford engineering PhD student.',
    price: 2400,
    location: {
      address: '450 Cambridge Ave, Palo Alto, CA 94306',
      city: 'Palo Alto',
      state: 'California',
      country: 'USA',
      latitude: 37.4419,
      longitude: -122.1430,
      nearbyUniversities: [{ name: 'Stanford University', distance: 0.5 }],
    },
    roomType: 'shared',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Parking', 'Gym Access', 'Pool', 'Dishwasher', 'Air Conditioning', 'Concierge', 'Security', 'Study Space'],
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1562113530-57ba7cea46ba?w=800&q=80',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    ],
    availableFrom: new Date('2025-02-01'),
    maxOccupants: 2,
    hostId: '2',
    host: mockUsers[1],
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-10'),
    status: 'active',
    preferences: {
      gender: 'any',
      smokingAllowed: false,
      petsAllowed: false,
      studyFriendly: true,
    },
    rules: [
      'Graduate students or professionals only',
      'Maintain high cleanliness standards',
      'Respect study time - no loud activities during finals',
      'Overnight guests limited to 2 nights per week',
      'Equal participation in apartment maintenance'
    ],
    deposit: 3600,
    utilities: {
      included: false,
      cost: 200
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
  // UCLA - Affordable Shared House
  {
    id: '3',
    title: 'Charming Single Room in Westwood House - Female Students Only',
    description: 'Beautiful private bedroom in a well-maintained 4-bedroom house, perfect for UCLA undergraduates or graduate students. This spacious room features hardwood floors, large windows, and a built-in desk area. The house includes a fully equipped kitchen, comfortable living areas, laundry facilities, and a lovely backyard perfect for studying outdoors. Located in safe, residential Westwood neighborhood, just 10 minutes walk to UCLA campus. Current housemates are friendly, studious women from various programs. Great community atmosphere with optional house dinners and study groups.',
    price: 1200,
    location: {
      address: '1045 Gayley Ave, Los Angeles, CA 90024',
      city: 'Los Angeles',
      state: 'California',
      country: 'USA',
      latitude: 34.0619,
      longitude: -118.4473,
      nearbyUniversities: [{ name: 'UCLA', distance: 0.7 }, { name: 'Santa Monica College', distance: 4.0 }],
    },
    roomType: 'single',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Common Area', 'Study Space', 'Furnished', 'Backyard', 'Dishwasher'],
    images: [
      'https://images.unsplash.com/photo-1560184897-502a9f170d9b?w=800&q=80',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
    ],
    availableFrom: new Date('2025-01-20'),
    availableTo: new Date('2025-06-15'),
    maxOccupants: 1,
    hostId: '3',
    host: mockUsers[2],
    createdAt: new Date('2024-12-05'),
    updatedAt: new Date('2024-12-05'),
    status: 'active',
    preferences: {
      gender: 'female',
      smokingAllowed: false,
      petsAllowed: false,
      studyFriendly: true,
    },
    rules: [
      'Female students only',
      'No smoking anywhere on property',
      'Quiet hours 10 PM - 8 AM',
      'Participate in weekly house meeting',
      'Keep common areas tidy',
      'No overnight male guests'
    ],
    deposit: 1200,
    utilities: {
      included: true
    }
  },

  // NYU - Premium Manhattan Studio
  {
    id: '4',
    title: 'Modern Studio in Greenwich Village - Steps from NYU Campus',
    description: 'Exceptional studio apartment in the heart of Greenwich Village, just 2 blocks from NYU\'s Washington Square campus. This sophisticated space features exposed brick walls, high ceilings, premium appliances, and a Murphy bed to maximize living space. Building amenities include 24/7 doorman, fitness center, rooftop terrace with Manhattan views, and package acceptance. Perfect for graduate students, law students, or professionals who want to experience authentic NYC living. Walking distance to subway lines, cafes, restaurants, and cultural attractions. Rare find in this prestigious neighborhood.',
    price: 3200,
    location: {
      address: '45 Bleecker St, New York, NY 10012',
      city: 'New York',
      state: 'New York',
      country: 'USA',
      latitude: 40.7282,
      longitude: -73.9942,
      nearbyUniversities: [
        { name: 'New York University', distance: 0.2 },
        { name: 'The New School', distance: 0.5 },
        { name: 'Cooper Union', distance: 0.8 }
      ],
    },
    roomType: 'studio',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Gym Access', 'Rooftop Terrace', 'Concierge', 'Security', 'Dishwasher', 'Air Conditioning', 'Heating'],
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    ],
    availableFrom: new Date('2025-02-15'),
    availableTo: new Date('2025-08-31'),
    maxOccupants: 1,
    hostId: '1',
    host: mockUsers[0],
    createdAt: new Date('2024-12-10'),
    updatedAt: new Date('2024-12-10'),
    status: 'active',
    preferences: {
      gender: 'any',
      smokingAllowed: false,
      petsAllowed: false,
      studyFriendly: true,
    },
    rules: [
      'Graduate students or professionals preferred',
      'No smoking in apartment or building',
      'Building quiet hours strictly enforced',
      'No unauthorized guests or parties',
      'Must maintain apartment to high standards'
    ],
    deposit: 4800,
    utilities: {
      included: true
    }
  },

  // University of Texas Austin - Affordable Share
  {
    id: '5',
    title: 'Spacious Room in Modern Apartment - UT Austin Area',
    description: 'Large private bedroom in a contemporary 3-bedroom apartment, perfect for UT Austin students. Located in the vibrant West Campus area, known for its student-friendly atmosphere and proximity to campus. Your room features a private bathroom, walk-in closet, and large windows. The apartment includes a modern kitchen with granite countertops, spacious living area, and in-unit laundry. Building amenities feature a resort-style pool, fitness center, study lounges, and covered parking. Walking distance to campus, shops, restaurants, and nightlife. Current roommates are friendly UT engineering students.',
    price: 850,
    location: {
      address: '2400 Nueces St, Austin, TX 78705',
      city: 'Austin',
      state: 'Texas',
      country: 'USA',
      latitude: 30.2849,
      longitude: -97.7341,
      nearbyUniversities: [
        { name: 'University of Texas at Austin', distance: 0.4 },
        { name: 'Austin Community College', distance: 2.1 }
      ],
    },
    roomType: 'shared',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Parking', 'Pool', 'Gym Access', 'Study Space', 'Air Conditioning', 'Dishwasher'],
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
    ],
    availableFrom: new Date('2025-01-10'),
    maxOccupants: 3,
    hostId: '2',
    host: mockUsers[1],
    createdAt: new Date('2024-11-25'),
    updatedAt: new Date('2024-12-01'),
    status: 'active',
    preferences: {
      gender: 'any',
      smokingAllowed: false,
      petsAllowed: true,
      studyFriendly: true,
    },
    rules: [
      'Students only',
      'No smoking indoors',
      'Clean up after yourself',
      'Respect study time during finals',
      'Split utilities equally among roommates'
    ],
    deposit: 850,
    utilities: {
      included: false,
      cost: 75
    }
  },

  // University of Washington - Seattle
  {
    id: '6',
    title: 'Cozy Studio Near University of Washington - U-District',
    description: 'Charming studio apartment in the heart of the University District, just 5 minutes walk to UW campus. This well-designed space maximizes every square foot with a loft bed, dedicated study area, and kitchenette. Features include hardwood floors, large windows with tree views, and updated fixtures. The building is quiet and well-maintained with coin laundry and bike storage. Located on a tree-lined street with easy access to campus, the Ave shopping district, and multiple bus lines. Perfect for focused graduate students or undergraduates who prefer a quiet, independent living situation.',
    price: 1100,
    location: {
      address: '4500 15th Ave NE, Seattle, WA 98105',
      city: 'Seattle',
      state: 'Washington',
      country: 'USA',
      latitude: 47.6587,
      longitude: -122.3140,
      nearbyUniversities: [
        { name: 'University of Washington', distance: 0.3 },
        { name: 'Seattle Central College', distance: 3.2 }
      ],
    },
    roomType: 'studio',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Study Space', 'Heating'],
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    ],
    availableFrom: new Date('2025-03-01'),
    availableTo: new Date('2025-08-31'),
    maxOccupants: 1,
    hostId: '3',
    host: mockUsers[2],
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-01'),
    status: 'active',
    preferences: {
      gender: 'any',
      smokingAllowed: false,
      petsAllowed: false,
      studyFriendly: true,
    },
    rules: [
      'No smoking',
      'Quiet building - respect neighbors',
      'No pets allowed',
      'Keep apartment clean and tidy'
    ],
    deposit: 1100,
    utilities: {
      included: false,
      cost: 80
    }
  },

  // University of Michigan - Ann Arbor
  {
    id: '7',
    title: 'Beautiful Room in Historic Ann Arbor Home - UMich Students',
    description: 'Charming private bedroom in a lovingly maintained 1920s home, just 1 mile from University of Michigan central campus. This spacious room features original hardwood floors, large windows, and vintage character details. The house includes a fully equipped kitchen, comfortable common areas, two full bathrooms, and a lovely backyard with garden space. Located in a quiet residential neighborhood with easy bus access to campus. Current housemates are graduate students and young professionals who enjoy occasional gatherings but respect each other\'s study time. Perfect for students who appreciate character homes and a sense of community.',
    price: 700,
    location: {
      address: '1234 Hill St, Ann Arbor, MI 48104',
      city: 'Ann Arbor',
      state: 'Michigan',
      country: 'USA',
      latitude: 42.2762,
      longitude: -83.7389,
      nearbyUniversities: [
        { name: 'University of Michigan', distance: 1.0 },
        { name: 'Eastern Michigan University', distance: 8.5 }
      ],
    },
    roomType: 'single',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Common Area', 'Study Space', 'Backyard', 'Heating'],
    images: [
      'https://images.unsplash.com/photo-1560184897-502a9f170d9b?w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    ],
    availableFrom: new Date('2025-01-01'),
    maxOccupants: 1,
    hostId: '1',
    host: mockUsers[0],
    createdAt: new Date('2024-11-20'),
    updatedAt: new Date('2024-11-30'),
    status: 'active',
    preferences: {
      gender: 'any',
      smokingAllowed: false,
      petsAllowed: true,
      studyFriendly: true,
    },
    rules: [
      'Students or young professionals preferred',
      'No smoking indoors',
      'Participate in shared household responsibilities',
      'Respect quiet hours during study periods',
      'Clean up after using common areas'
    ],
    deposit: 700,
    utilities: {
      included: false,
      cost: 60
    }
  },

  // UC San Diego - Modern Apartment
  {
    id: '8',
    title: 'Luxury Shared Apartment in La Jolla - UCSD Students',
    description: 'Premium 2-bedroom apartment in prestigious La Jolla location, perfect for UCSD graduate students or professionals. This modern unit features floor-to-ceiling windows with ocean glimpses, quartz countertops, stainless steel appliances, and luxury vinyl plank flooring. Your private bedroom includes an en-suite bathroom and walk-in closet. Building amenities include a resort-style pool, hot tub, fitness center, clubhouse, and covered parking. Located minutes from UCSD campus and La Jolla beaches. Current roommate is a quiet PhD student in bioengineering. Ideal for serious students who appreciate high-quality living in one of San Diego\'s most desirable areas.',
    price: 1900,
    location: {
      address: '8799 Costa Verde Blvd, San Diego, CA 92122',
      city: 'San Diego',
      state: 'California',
      country: 'USA',
      latitude: 32.8777,
      longitude: -117.2089,
      nearbyUniversities: [
        { name: 'UC San Diego', distance: 0.8 },
        { name: 'San Diego State University', distance: 12.5 }
      ],
    },
    roomType: 'shared',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Parking', 'Pool', 'Gym Access', 'Air Conditioning', 'Dishwasher', 'Security'],
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1562113530-57ba7cea46ba?w=800&q=80',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    ],
    availableFrom: new Date('2025-02-01'),
    maxOccupants: 2,
    hostId: '2',
    host: mockUsers[1],
    createdAt: new Date('2024-12-05'),
    updatedAt: new Date('2024-12-05'),
    status: 'active',
    preferences: {
      gender: 'any',
      smokingAllowed: false,
      petsAllowed: false,
      studyFriendly: true,
    },
    rules: [
      'Graduate students or professionals only',
      'No smoking anywhere on property',
      'Maintain apartment to luxury standards',
      'Respect study schedules and quiet time',
      'No parties or large gatherings'
    ],
    deposit: 2850,
    utilities: {
      included: false,
      cost: 120
    }
  },

  // University of Colorado Boulder
  {
    id: '9',
    title: 'Mountain View Studio Near CU Boulder - Outdoor Enthusiasts Welcome',
    description: 'Stunning studio apartment with breathtaking mountain views, just 1.5 miles from CU Boulder campus. This bright, airy space features vaulted ceilings, a private balcony, full kitchen, and modern bathroom. Perfect for students who love the outdoors - hiking trails literally at your doorstep and world-class skiing just 30 minutes away. The building offers bike storage, a fitness center, and a rooftop deck with 360-degree mountain views. Located on the bus line for easy campus access. Ideal for graduate students, outdoor recreation majors, or anyone wanting to experience the Colorado lifestyle while pursuing their education.',
    price: 1250,
    location: {
      address: '1850 Folsom St, Boulder, CO 80302',
      city: 'Boulder',
      state: 'Colorado',
      country: 'USA',
      latitude: 40.0150,
      longitude: -105.2705,
      nearbyUniversities: [
        { name: 'University of Colorado Boulder', distance: 1.5 },
        { name: 'Front Range Community College', distance: 4.2 }
      ],
    },
    roomType: 'studio',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Gym Access', 'Rooftop Terrace', 'Heating', 'Air Conditioning'],
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    ],
    availableFrom: new Date('2025-01-15'),
    availableTo: new Date('2025-12-31'),
    maxOccupants: 1,
    hostId: '3',
    host: mockUsers[2],
    createdAt: new Date('2024-11-15'),
    updatedAt: new Date('2024-12-01'),
    status: 'active',
    preferences: {
      gender: 'any',
      smokingAllowed: false,
      petsAllowed: true,
      studyFriendly: true,
    },
    rules: [
      'Students or young professionals preferred',
      'No smoking indoors',
      'Pets allowed with deposit',
      'Quiet hours during finals week',
      'Respect building hiking trail access'
    ],
    deposit: 1250,
    utilities: {
      included: false,
      cost: 90
    }
  },

  // University of Florida - Gainesville
  {
    id: '10',
    title: 'Spacious Room in Gated Community - UF Students',
    description: 'Large private bedroom with attached bathroom in a modern 4-bedroom apartment near University of Florida campus. Located in a safe, gated community popular with graduate students and upperclassmen. Your room is fully furnished with a queen bed, desk, dresser, and walk-in closet. The apartment features a modern kitchen with granite countertops, spacious living area, and screened patio. Community amenities include a resort-style pool, fitness center, tennis court, study lounges, and 24/7 security. Shuttle service to campus available. Current roommates are responsible UF students in engineering and business programs.',
    price: 650,
    location: {
      address: '3700 SW 27th St, Gainesville, FL 32608',
      city: 'Gainesville',
      state: 'Florida',
      country: 'USA',
      latitude: 29.6436,
      longitude: -82.3549,
      nearbyUniversities: [
        { name: 'University of Florida', distance: 2.1 },
        { name: 'Santa Fe College', distance: 4.5 }
      ],
    },
    roomType: 'shared',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen', 'Parking', 'Pool', 'Gym Access', 'Study Space', 'Air Conditioning', 'Furnished', 'Security'],
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
    ],
    availableFrom: new Date('2025-01-05'),
    maxOccupants: 4,
    hostId: '1',
    host: mockUsers[0],
    createdAt: new Date('2024-11-10'),
    updatedAt: new Date('2024-11-25'),
    status: 'active',
    preferences: {
      gender: 'any',
      smokingAllowed: false,
      petsAllowed: false,
      studyFriendly: true,
    },
    rules: [
      'UF students only',
      'No smoking anywhere on property',
      'Keep common areas clean and organized',
      'Respect quiet hours during study periods',
      'Participate in monthly roommate meetings'
    ],
    deposit: 650,
    utilities: {
      included: false,
      cost: 45
    }
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
  // California Universities
  'University of California, Berkeley',
  'Stanford University',
  'UCLA',
  'USC',
  'UC San Diego',
  'UC San Francisco',
  'UC Davis',
  'UC Irvine',
  'UC Santa Barbara',
  'UC Santa Cruz',
  'UC Riverside',
  'UC Merced',
  'California Institute of Technology',
  'San Jose State University',
  'Santa Clara University',
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
  
  // East Coast Universities
  'Harvard University',
  'MIT',
  'Yale University',
  'Princeton University',
  'Columbia University',
  'University of Pennsylvania',
  'Cornell University',
  'Dartmouth College',
  'Brown University',
  'New York University',
  'Boston University',
  'Northeastern University',
  'Boston College',
  'Tufts University',
  'Georgetown University',
  'George Washington University',
  'Johns Hopkins University',
  'University of Maryland',
  'Rutgers University',
  'The New School',
  'Cooper Union',
  'Fordham University',
  'Syracuse University',
  'University of Rochester',
  
  // Southeast Universities
  'University of Florida',
  'Florida State University',
  'University of Miami',
  'Florida Institute of Technology',
  'University of Georgia',
  'Georgia Institute of Technology',
  'Emory University',
  'University of North Carolina at Chapel Hill',
  'NC State University',
  'Duke University',
  'Wake Forest University',
  'University of South Carolina',
  'Clemson University',
  'University of Virginia',
  'Virginia Tech',
  'University of Tennessee',
  'Vanderbilt University',
  'University of Alabama',
  'Auburn University',
  'University of Kentucky',
  'University of Louisville',
  
  // Midwest Universities
  'University of Michigan',
  'Michigan State University',
  'University of Chicago',
  'Northwestern University',
  'University of Illinois at Urbana-Champaign',
  'University of Illinois at Chicago',
  'DePaul University',
  'Loyola University Chicago',
  'University of Wisconsin-Madison',
  'University of Minnesota',
  'Ohio State University',
  'University of Cincinnati',
  'Case Western Reserve University',
  'University of Notre Dame',
  'Purdue University',
  'Indiana University',
  'University of Iowa',
  'Iowa State University',
  'University of Kansas',
  'Kansas State University',
  'University of Missouri',
  'Washington University in St. Louis',
  'Saint Louis University',
  'University of Nebraska',
  'Creighton University',
  
  // Texas Universities
  'University of Texas at Austin',
  'Texas A&M University',
  'Rice University',
  'University of Houston',
  'Texas Tech University',
  'Baylor University',
  'TCU',
  'Southern Methodist University',
  'University of Texas at Dallas',
  'Texas State University',
  
  // Mountain West Universities
  'University of Colorado Boulder',
  'Colorado State University',
  'University of Denver',
  'Colorado School of Mines',
  'University of Utah',
  'Utah State University',
  'Brigham Young University',
  'University of Arizona',
  'Arizona State University',
  'Northern Arizona University',
  'University of New Mexico',
  'New Mexico State University',
  'University of Nevada, Las Vegas',
  'University of Nevada, Reno',
  'University of Wyoming',
  'Montana State University',
  'University of Montana',
  'Boise State University',
  'University of Idaho',
  
  // Pacific Northwest Universities
  'University of Washington',
  'Washington State University',
  'Seattle University',
  'University of Oregon',
  'Oregon State University',
  'Portland State University',
  
  // Alaska & Hawaii
  'University of Alaska Anchorage',
  'University of Hawaii at Manoa',
];