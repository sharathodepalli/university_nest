// import React, {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   ReactNode,
//   useCallback,
//   useMemo,
// } from "react";
// import { supabase } from "../lib/supabase";
// import { useAuth } from "./AuthContext";
// import { Listing, SearchFilters, User } from "../types";
// import { mockListings } from "../data/mockData";
// import MatchingService from "../lib/matching";
// import { errorHandler } from "../lib/errorHandler";
// import { performanceMonitor } from "../lib/performance";
// import { updateListingsWithRealAddresses } from "../lib/realAddressIntegration";
// import { calculateDistance } from "../utils/haversine";
// import { universityData, getNearbyUniversities } from "../data/universities";

// interface ListingsContextType {
//   listings: Listing[];
//   filteredListings: Listing[];
//   recommendedListings: Listing[];
//   filters: SearchFilters;
//   setFilters: (filters: SearchFilters) => void;
//   addListing: (
//     listing: Omit<Listing, "id" | "createdAt" | "updatedAt" | "host">
//   ) => Promise<void>;
//   updateListing: (id: string, updates: Partial<Listing>) => Promise<void>;
//   deleteListing: (id: string) => Promise<void>;
//   favoriteListings: string[];
//   toggleFavorite: (listingId: string) => Promise<void>;
//   isLoading: boolean;
//   error: string | null;
//   refreshListings: () => Promise<void>;
//   sortBy: string;
//   setSortBy: (sortBy: string) => void;
//   universitySuggestions: string[];
// }

// const ListingsContext = createContext<ListingsContextType | undefined>(
//   undefined
// );

// export const useListings = () => {
//   const context = useContext(ListingsContext);
//   if (!context) {
//     throw new Error("useListings must be used within a ListingsProvider");
//   }
//   return context;
// };

// interface ListingsProviderProps {
//   children: ReactNode;
// }

// export const ListingsProvider: React.FC<ListingsProviderProps> = ({
//   children,
// }) => {
//   const { user, isSupabaseReady } = useAuth();
//   const [listings, setListings] = useState<Listing[]>([]);
//   const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
//   const [recommendedListings, setRecommendedListings] = useState<Listing[]>([]);
//   const [filters, setFilters] = useState<SearchFilters>({});
//   const [favoriteListings, setFavoriteListings] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [sortBy, setSortBy] = useState("relevance");

//   const universitySuggestions = useMemo(() => {
//     const universities = new Set<string>();

//     // Add universities from listings
//     listings.forEach((listing) => {
//       if (
//         listing.location.nearbyUniversities &&
//         listing.location.nearbyUniversities.length > 0
//       ) {
//         listing.location.nearbyUniversities.forEach((uni) =>
//           universities.add(uni.name)
//         );
//       } else if (listing.host && listing.host.university) {
//         // Fallback for listings without nearbyUniversities array but with a host university
//         universities.add(listing.host.university);
//       }
//     });

//     // Add user's university
//     if (user?.university) {
//       universities.add(user.university);
//     }

//     // Add universities from the static list as a fallback
//     universityData.forEach((uni) => universities.add(uni.name));

//     return Array.from(universities).sort();
//   }, [listings, user]);

//   /**
//    * Refreshes the list of listings, either from mock data or Supabase.
//    * Also populates nearby universities and handles coordinate validation.
//    */
//   const refreshListings = useCallback(async () => {
//     try {
//       setIsLoading(true);
//       setError(null);

//       if (import.meta.env.DEV) {
//         console.log(
//           "[ListingsContext] Refreshing listings. Supabase ready:",
//           isSupabaseReady
//         );
//       }

//       if (!isSupabaseReady) {
//         // Use mock data with verified real addresses for development
//         console.log(
//           "[ListingsContext] Using mock data. Available listings:",
//           mockListings.length
//         );
//         await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate loading

//         const listingsWithRealAddresses =
//           updateListingsWithRealAddresses(mockListings);

//         setListings(listingsWithRealAddresses);
//         setIsLoading(false);
//         return;
//       }

//       const startTime = performance.now();

//       // Fetch listings and their host profiles from Supabase
//       const { data, error: fetchError } = await supabase
//         .from("listings")
//         .select(
//           `
//           *,
//           profiles:host_id (
//             id,
//             name,
//             university,
//             year,
//             bio,
//             phone,
//             verified,
//             profile_picture,
//             preferences,
//             location,
//             matchingPreferences
//           )
//         `
//         )
//         .eq("status", "active")
//         .order("created_at", { ascending: false });

//       performanceMonitor.recordMetric(
//         "listings_fetch_time",
//         performance.now() - startTime
//       );

//       if (fetchError) {
//         throw new Error(`Failed to fetch listings: ${fetchError.message}`);
//       }

//       const formattedListings = (data || [])
//         .map((item): Listing | null => {
//           try {
//             const latitude = item.location?.latitude;
//             const longitude = item.location?.longitude;

//             let nearbyUniversities: { name: string; distance: number }[] = [];

//             // Only calculate nearby universities if valid coordinates are present
//             // This prevents calculating distances from (0,0) 'Null Island'
//             if (
//               typeof latitude === "number" &&
//               latitude !== 0 &&
//               typeof longitude === "number" &&
//               longitude !== 0
//             ) {
//               nearbyUniversities = getNearbyUniversities(
//                 { lat: latitude, lng: longitude },
//                 50 // 50 miles radius
//               );
//             } else {
//               console.warn(
//                 `[ListingsContext] Listing ${item.id} has invalid or zero coordinates. Skipping nearby universities calculation.`
//               );
//             }

//             return {
//               id: item.id,
//               title: item.title || "Untitled Listing",
//               description: item.description || "",
//               price: typeof item.price === "number" ? item.price : 0,
//               location: {
//                 address: item.location?.address || "Unknown Address",
//                 city: item.location?.city || "Unknown",
//                 state: item.location?.state || "Unknown",
//                 country: item.location?.country || "USA",
//                 latitude: typeof latitude === "number" ? latitude : 0, // Ensure numeric type for latitude
//                 longitude: typeof longitude === "number" ? longitude : 0, // Ensure numeric type for longitude
//                 nearbyUniversities: nearbyUniversities, // Assign the (potentially empty) calculated array
//               },
//               roomType: item.room_type || "single",
//               amenities: Array.isArray(item.amenities) ? item.amenities : [],
//               images: Array.isArray(item.images) ? item.images : [],
//               availableFrom: item.available_from
//                 ? new Date(item.available_from)
//                 : new Date(),
//               availableTo: item.available_to
//                 ? new Date(item.available_to)
//                 : undefined,
//               maxOccupants:
//                 typeof item.max_occupants === "number" ? item.max_occupants : 1,
//               hostId: item.host_id,
//               host: {
//                 // Map fetched profile data to User type
//                 id: item.profiles?.id || item.host_id,
//                 name: item.profiles?.name || "Unknown Host",
//                 email: item.profiles?.email || "", // Email should be pulled from profiles table now
//                 university: item.profiles?.university || "Unknown University",
//                 year: item.profiles?.year || "Unknown",
//                 bio: item.profiles?.bio || "",
//                 phone: item.profiles?.phone || undefined,
//                 verified: Boolean(item.profiles?.verified), // Keep legacy field for backward compatibility
//                 student_verified: Boolean(item.profiles?.student_verified),
//                 student_email: item.profiles?.student_email || undefined,
//                 verification_status:
//                   item.profiles?.verification_status || "unverified",
//                 verification_method:
//                   item.profiles?.verification_method || undefined,
//                 verified_at: item.profiles?.verified_at
//                   ? new Date(item.profiles.verified_at)
//                   : undefined,
//                 profilePicture: item.profiles?.profile_picture || undefined,
//                 preferences: item.profiles?.preferences || {},
//                 location: item.profiles?.location || {
//                   // Use fetched location from profile or default
//                   address: "",
//                   city: "",
//                   state: "",
//                   country: "",
//                   coordinates: { lat: 0, lng: 0 },
//                 },
//                 matchingPreferences: item.profiles?.matchingPreferences || {}, // Use fetched matchingPreferences or default
//                 createdAt: item.profiles?.created_at
//                   ? new Date(item.profiles.created_at)
//                   : new Date(),
//               } as User, // Assert as User type
//               createdAt: item.created_at
//                 ? new Date(item.created_at)
//                 : new Date(),
//               updatedAt: item.updated_at
//                 ? new Date(item.updated_at)
//                 : new Date(),
//               status: item.status || "active",
//               preferences: item.preferences || {},
//               rules: Array.isArray(item.rules) ? item.rules : [],
//               deposit:
//                 typeof item.deposit === "number" ? item.deposit : undefined,
//               utilities: item.utilities || {},
//             };
//           } catch (itemError) {
//             errorHandler.logError(
//               new Error(`Error formatting listing ${item.id}: ${itemError}`)
//             );
//             return null; // Return null for problematic listings
//           }
//         })
//         .filter((listing): listing is Listing => listing !== null); // Filter out nulls

//       if (import.meta.env.DEV) {
//         console.log(
//           "[ListingsContext] Formatted listings:",
//           formattedListings.length
//         );
//       }
//       setListings(formattedListings);
//     } catch (error) {
//       const errorMessage =
//         error instanceof Error ? error.message : "Failed to fetch listings";
//       setError(errorMessage);
//       errorHandler.logError(new Error(errorMessage));

//       // Always fallback to mock data on error or in development
//       console.log(
//         "[ListingsContext] Error occurred, falling back to mock data. Error:",
//         errorMessage
//       );
//       setListings(updateListingsWithRealAddresses(mockListings)); // Ensure mock data fallback is also processed
//     } finally {
//       setIsLoading(false);
//     }
//   }, [isSupabaseReady]);

//   /**
//    * Fetches favorite listings for the current user.
//    */
//   const fetchFavorites = useCallback(async () => {
//     if (!user) return; // Only fetch if user is logged in

//     try {
//       if (!isSupabaseReady) {
//         // Load favorites from localStorage for development
//         const storedFavorites = localStorage.getItem("uninest_favorites");
//         if (storedFavorites) {
//           try {
//             const parsed = JSON.parse(storedFavorites);
//             setFavoriteListings(Array.isArray(parsed) ? parsed : []);
//           } catch (error) {
//             errorHandler.logError(
//               new Error("[ListingsContext] Error parsing stored favorites")
//             );
//             setFavoriteListings([]);
//           }
//         }
//         return;
//       }

//       // Fetch favorites from Supabase
//       const { data, error } = await supabase
//         .from("favorites")
//         .select("listing_id")
//         .eq("user_id", user.id);

//       if (error) {
//         throw new Error(`Failed to fetch favorites: ${error.message}`);
//       }

//       setFavoriteListings((data || []).map((fav: any) => fav.listing_id));
//     } catch (error) {
//       errorHandler.logError(
//         new Error(`[ListingsContext] Error fetching favorites: ${error}`)
//       );
//       setFavoriteListings([]); // Clear favorites on error
//     }
//   }, [user, isSupabaseReady]);

//   /**
//    * Applies current filters and sorting preferences to the listings.
//    */
//   const applyFiltersAndSorting = useCallback(() => {
//     try {
//       let currentFilteredListings = [...listings];
//       if (import.meta.env.DEV) {
//         console.log(
//           "[ListingsContext] Applying filters to",
//           currentFilteredListings.length,
//           "listings"
//         );
//       }

//       // Apply search query filter
//       if (filters.query) {
//         const searchTerm = filters.query.toLowerCase();
//         currentFilteredListings = currentFilteredListings.filter(
//           (listing) =>
//             listing.title.toLowerCase().includes(searchTerm) ||
//             listing.description.toLowerCase().includes(searchTerm) ||
//             listing.location.city.toLowerCase().includes(searchTerm)
//         );
//       }

//       // Apply location filter (city, address, or zip code in text search)
//       if (filters.location) {
//         const searchTerm = filters.location.toLowerCase();
//         currentFilteredListings = currentFilteredListings.filter((listing) => {
//           const location = listing.location || {};
//           return (
//             (location.city || "").toLowerCase().includes(searchTerm) ||
//             (location.address || "").toLowerCase().includes(searchTerm) ||
//             (location.nearbyUniversities || []).some((uni) =>
//               uni.name.toLowerCase().includes(searchTerm)
//             )
//           );
//         });
//       }

//       // University Filter
//       if (filters.university) {
//         const universityToFilter =
//           typeof filters.university === "string"
//             ? filters.university
//             : filters.university.custom;

//         if (universityToFilter) {
//           const lowercasedUniversity = universityToFilter.toLowerCase();
//           currentFilteredListings = currentFilteredListings.filter(
//             (listing) => {
//               const hostUniversityMatch =
//                 listing.host?.university?.toLowerCase() ===
//                 lowercasedUniversity;

//               const nearbyUniversityMatch = (
//                 listing.location.nearbyUniversities || []
//               ).some((uni) => uni.name.toLowerCase() === lowercasedUniversity);

//               return hostUniversityMatch || nearbyUniversityMatch;
//             }
//           );
//         }
//       }

//       // Max Distance Filter (from user's location)
//       if (
//         filters.maxDistance !== undefined &&
//         user?.location?.coordinates?.lat !== undefined &&
//         user?.location?.coordinates?.lng !== undefined &&
//         (user.location.coordinates.lat !== 0 ||
//           user.location.coordinates.lng !== 0)
//       ) {
//         const userCoordinates = user.location.coordinates;
//         currentFilteredListings = currentFilteredListings.filter((listing) => {
//           if (
//             !listing.location?.latitude ||
//             !listing.location?.longitude ||
//             (listing.location.latitude === 0 &&
//               listing.location.longitude === 0)
//           ) {
//             return false; // Exclude listings with invalid/zero coordinates
//           }

//           const distance = calculateDistance(
//             userCoordinates.lat,
//             userCoordinates.lng,
//             listing.location.latitude,
//             listing.location.longitude
//           );
//           return distance <= filters.maxDistance!;
//         });
//       }

//       // Price Range Filter
//       if (filters.priceRange) {
//         currentFilteredListings = currentFilteredListings.filter((listing) => {
//           const price = listing.price || 0;
//           const minPrice = filters.priceRange?.min ?? 0;
//           const maxPrice = filters.priceRange?.max ?? Infinity;
//           return price >= minPrice && price <= maxPrice;
//         });
//       }

//       // Room Type Filter
//       if (filters.roomType && filters.roomType.length > 0) {
//         currentFilteredListings = currentFilteredListings.filter((listing) =>
//           filters.roomType!.includes(listing.roomType)
//         );
//       }

//       // Amenities Filter
//       if (filters.amenities && filters.amenities.length > 0) {
//         currentFilteredListings = currentFilteredListings.filter((listing) =>
//           filters.amenities!.every((amenity) =>
//             (listing.amenities || []).includes(amenity)
//           )
//         );
//       }

//       // Available From (Move-in Date) Filter
//       if (filters.availableFrom instanceof Date) {
//         // Ensure it's a Date object
//         currentFilteredListings = currentFilteredListings.filter(
//           (listing) =>
//             listing.availableFrom &&
//             listing.availableFrom.getTime() >= filters.availableFrom!.getTime()
//         );
//       }

//       // Move-in Date (string from input) Filter
//       if (filters.moveInDate) {
//         const filterDate = new Date(filters.moveInDate);
//         currentFilteredListings = currentFilteredListings.filter(
//           (listing) =>
//             listing.availableFrom &&
//             listing.availableFrom.getTime() <= filterDate.getTime()
//         );
//       }

//       // Apply user-based filtering (e.g., exclude own listings) if user is logged in
//       if (user) {
//         currentFilteredListings = currentFilteredListings.filter(
//           (listing) => listing.hostId !== user.id
//         );

//         // Apply sorting with user context (relevance, match, distance, etc.)
//         currentFilteredListings = MatchingService.sortListings(
//           currentFilteredListings,
//           sortBy,
//           user
//         );
//       } else {
//         // Default sorting for non-logged-in users
//         switch (sortBy) {
//           case "price-asc":
//             currentFilteredListings.sort(
//               (a, b) => (a.price || 0) - (b.price || 0)
//             );
//             break;
//           case "price-desc":
//             currentFilteredListings.sort(
//               (a, b) => (b.price || 0) - (a.price || 0)
//             );
//             break;
//           case "newest":
//             currentFilteredListings.sort((a, b) => {
//               const timeA = a.createdAt ? a.createdAt.getTime() : 0;
//               const timeB = b.createdAt ? b.createdAt.getTime() : 0;
//               return timeB - timeA;
//             });
//             break;
//           default:
//             // Keep current order if no specific sort or user is not logged in
//             break;
//         }
//       }

//       console.log(
//         "[ListingsContext] Filtered listings count:",
//         currentFilteredListings.length
//       );
//       setFilteredListings(currentFilteredListings);
//     } catch (error) {
//       errorHandler.logError(
//         new Error(`[ListingsContext] Error applying filters: ${error}`)
//       );
//       setFilteredListings(listings); // Fallback to all listings on filter error
//     }
//   }, [listings, filters, sortBy, user]);

//   /**
//    * Generates personalized listing recommendations for the current user.
//    */
//   const generateRecommendations = useCallback(() => {
//     if (!user || listings.length === 0) {
//       console.log(
//         "[ListingsContext] No user or listings to generate recommendations."
//       );
//       setRecommendedListings([]);
//       return;
//     }

//     try {
//       console.log(
//         "[ListingsContext] Generating recommendations for user:",
//         user.university
//       );
//       // Ensure relevance and match scores are calculated for each listing
//       const listingsWithScores = listings.map((listing) => ({
//         ...listing,
//         matchScore: MatchingService.calculateMatchScore(user, listing),
//         relevanceScore: MatchingService.calculateRelevanceScore(user, listing),
//       }));

//       const recommendations = MatchingService.getRecommendations(
//         user,
//         listingsWithScores,
//         6 // Limit to 6 recommendations for display
//       );
//       console.log(
//         "[ListingsContext] Generated recommendations count:",
//         recommendations.length
//       );
//       setRecommendedListings(recommendations);
//     } catch (error) {
//       errorHandler.logError(
//         new Error(
//           `[ListingsContext] Error generating recommendations: ${error}`
//         )
//       );
//       setRecommendedListings([]); // Clear recommendations on error
//     }
//   }, [user, listings]);

//   /**
//    * Adds a new listing to the database or mock data.
//    */
//   const addListing = useCallback(
//     async (
//       newListing: Omit<Listing, "id" | "createdAt" | "updatedAt" | "host">
//     ) => {
//       if (!user) throw new Error("User must be logged in to create a listing.");

//       try {
//         if (!isSupabaseReady) {
//           console.log("[ListingsContext] Mock add listing for development.");
//           const listing: Listing = {
//             ...newListing,
//             id: Date.now().toString(),
//             host: user, // Assign current user as host
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           };
//           setListings((prev) => [listing, ...prev]); // Add to beginning of list
//           return;
//         }

//         // Insert new listing into Supabase
//         const { error } = await supabase
//           .from("listings")
//           .insert({
//             title: newListing.title,
//             description: newListing.description,
//             price: newListing.price,
//             location: newListing.location,
//             room_type: newListing.roomType,
//             amenities: newListing.amenities,
//             images: newListing.images,
//             available_from: newListing.availableFrom.toISOString(), // Store as ISO string
//             available_to: newListing.availableTo?.toISOString() || null, // Store as ISO string or null
//             max_occupants: newListing.maxOccupants,
//             host_id: user.id, // Link to current user's ID
//             status: newListing.status,
//             preferences: newListing.preferences,
//             rules: newListing.rules,
//             deposit: newListing.deposit,
//             utilities: newListing.utilities,
//           })
//           .select()
//           .single(); // Get the inserted row

//         if (error) throw error;

//         await refreshListings(); // Refresh all listings to include the new one
//       } catch (error: any) {
//         const errorMessage = error.message || "Failed to create listing";
//         errorHandler.logError(
//           new Error(`[ListingsContext] Add listing failed: ${errorMessage}`)
//         );
//         throw new Error(errorMessage);
//       }
//     },
//     [user, isSupabaseReady, refreshListings]
//   );

//   /**
//    * Updates an existing listing in the database or mock data.
//    */
//   const updateListing = useCallback(
//     async (id: string, updates: Partial<Listing>) => {
//       try {
//         if (!isSupabaseReady) {
//           console.log("[ListingsContext] Mock update listing for development.");
//           setListings((prev) =>
//             prev.map((listing) =>
//               listing.id === id
//                 ? { ...listing, ...updates, updatedAt: new Date() }
//                 : listing
//             )
//           );
//           return;
//         }

//         // Update listing in Supabase
//         const { error } = await supabase
//           .from("listings")
//           .update({
//             title: updates.title,
//             description: updates.description,
//             price: updates.price,
//             location: updates.location,
//             room_type: updates.roomType,
//             amenities: updates.amenities,
//             images: updates.images,
//             available_from: updates.availableFrom?.toISOString() || undefined,
//             available_to: updates.availableTo?.toISOString() || null,
//             max_occupants: updates.maxOccupants,
//             status: updates.status,
//             preferences: updates.preferences,
//             rules: updates.rules,
//             deposit: updates.deposit,
//             utilities: updates.utilities,
//           })
//           .eq("id", id); // Find by ID

//         if (error) throw error;

//         await refreshListings(); // Refresh all listings after update
//       } catch (error: any) {
//         const errorMessage = error.message || "Failed to update listing";
//         errorHandler.logError(
//           new Error(`[ListingsContext] Update listing failed: ${errorMessage}`)
//         );
//         throw new Error(errorMessage);
//       }
//     },
//     [isSupabaseReady, refreshListings]
//   );

//   /**
//    * Deletes a listing from the database or mock data.
//    */
//   const deleteListing = useCallback(
//     async (id: string) => {
//       try {
//         if (!isSupabaseReady) {
//           console.log("[ListingsContext] Mock delete listing for development.");
//           setListings((prev) => prev.filter((listing) => listing.id !== id));
//           return;
//         }

//         // Delete from Supabase
//         const { error } = await supabase.from("listings").delete().eq("id", id);

//         if (error) throw error;

//         await refreshListings(); // Refresh all listings after deletion
//       } catch (error: any) {
//         const errorMessage = error.message || "Failed to delete listing";
//         errorHandler.logError(
//           new Error(`[ListingsContext] Delete listing failed: ${errorMessage}`)
//         );
//         throw new Error(errorMessage);
//       }
//     },
//     [isSupabaseReady, refreshListings]
//   );

//   /**
//    * Toggles a listing as a favorite for the current user.
//    */
//   const toggleFavorite = useCallback(
//     async (listingId: string) => {
//       if (!user) {
//         console.warn(
//           "[ListingsContext] User not logged in. Cannot toggle favorite."
//         );
//         return;
//       }

//       const isFavorite = favoriteListings.includes(listingId);

//       try {
//         if (!isSupabaseReady) {
//           console.log(
//             "[ListingsContext] Mock toggle favorite for development."
//           );
//           const updated = isFavorite
//             ? favoriteListings.filter((id) => id !== listingId)
//             : [...favoriteListings, listingId];

//           setFavoriteListings(updated);
//           localStorage.setItem("uninest_favorites", JSON.stringify(updated));
//           return;
//         }

//         // Perform Supabase favorite toggle
//         if (isFavorite) {
//           const { error } = await supabase
//             .from("favorites")
//             .delete()
//             .eq("user_id", user.id)
//             .eq("listing_id", listingId);

//           if (error) throw error;

//           setFavoriteListings((prev) => prev.filter((id) => id !== listingId));
//         } else {
//           const { error } = await supabase.from("favorites").insert({
//             user_id: user.id,
//             listing_id: listingId,
//           });

//           if (error) throw error;

//           setFavoriteListings((prev) => [...prev, listingId]);
//         }
//       } catch (error) {
//         errorHandler.logError(
//           new Error(`[ListingsContext] Error toggling favorite: ${error}`)
//         );
//       }
//     },
//     [user, favoriteListings, isSupabaseReady]
//   );

//   // Effects for data loading and filtering
//   useEffect(() => {
//     refreshListings(); // Initial fetch
//   }, [refreshListings]);

//   useEffect(() => {
//     if (user) {
//       fetchFavorites(); // Fetch favorites when user changes
//     } else {
//       setFavoriteListings([]); // Clear favorites if user logs out
//     }
//   }, [user, fetchFavorites]);

//   useEffect(() => {
//     // Apply filters and sorting whenever listings data, filters, or sort preferences change
//     if (listings.length > 0 || !isLoading) {
//       // Only apply if listings are loaded or loading has finished
//       performanceMonitor.measureFunction("apply_filters_and_sorting", () => {
//         applyFiltersAndSorting();
//       });
//     }
//   }, [applyFiltersAndSorting, listings, isLoading, filters, sortBy]); // Added 'listings' to dependencies

//   useEffect(() => {
//     // Generate recommendations whenever user or listings data changes
//     performanceMonitor.measureFunction("generate_recommendations", () => {
//       generateRecommendations();
//     });
//   }, [generateRecommendations, user, listings]); // Added 'user' and 'listings' to dependencies

//   // Memoized context value to prevent unnecessary re-renders
//   const contextValue = useMemo(
//     () => ({
//       listings,
//       filteredListings,
//       recommendedListings,
//       filters,
//       setFilters,
//       addListing,
//       updateListing,
//       deleteListing,
//       favoriteListings,
//       toggleFavorite,
//       isLoading,
//       error,
//       refreshListings,
//       sortBy,
//       setSortBy,
//       universitySuggestions,
//     }),
//     [
//       listings,
//       filteredListings,
//       recommendedListings,
//       filters,
//       addListing,
//       updateListing,
//       deleteListing,
//       favoriteListings,
//       toggleFavorite,
//       isLoading,
//       error,
//       refreshListings,
//       sortBy,
//       universitySuggestions,
//     ]
//   );

//   return (
//     <ListingsContext.Provider value={contextValue}>
//       {children}
//     </ListingsContext.Provider>
//   );
// };
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { Listing, User, SearchFilters } from "../types";
import { MatchingService } from "../lib/matching";
import { useTabVisibility } from "../hooks/useTabVisibility";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

interface ListingsContextType {
  listings: Listing[];
  isLoading: boolean;
  error: string | null;
  fetchListings: () => Promise<void>;
  recommendedListings: Listing[];
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
}

const ListingsContext = createContext<ListingsContextType | undefined>(
  undefined
);

export const useListings = () => {
  const context = useContext(ListingsContext);
  if (!context) {
    throw new Error("useListings must be used within a ListingsProvider");
  }
  return context;
};

export const ListingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, isSupabaseReady } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendedListings, setRecommendedListings] = useState<Listing[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState<string>("relevance");
  const isOnline = useOnlineStatus();
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchListings = useCallback(async () => {
    // Throttle rapid successive calls
    const now = Date.now();
    if (now - lastFetchTime < 5000 && lastFetchTime !== 0) {
      console.log("[ListingsContext] Throttling listing fetch, too recent");
      return;
    }
    setLastFetchTime(now);

    setIsLoading(true);
    setError(null);

    // Fallback to mock data if Supabase is not ready or offline
    if (!isSupabaseReady || !isOnline) {
      console.log("[ListingsContext] Using mock data. Available listings:", 7);
      setListings([
        {
          id: "mock-1",
          hostId: "mock-user-1",
          title: "Mock Apartment near Campus",
          description: "A comfortable apartment with 2 bedrooms and 1 bath.",
          price: 750,
          // FIX: Updated location to match Location interface
          location: {
            address: "123 Mock St",
            city: "Mockville",
            state: "OH",
            country: "USA",
            latitude: 39.123,
            longitude: -84.567,
            nearbyUniversities: [],
          },
          // FIX: Updated roomType to a valid type
          roomType: "apartment",
          amenities: ["Wi-Fi", "Laundry", "Furnished"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-08-01"),
          availableTo: new Date("2026-07-31"),
          maxOccupants: 2,
          host: {
            id: "mock-user-1",
            name: "Mock Host 1",
            email: "mock1@example.com",
            university: "Mock University",
            year: "Junior",
            bio: "Friendly host",
            verified: true,
            student_verified: true,
            student_email: "mock1@example.edu",
            verification_status: "verified",
            verification_method: "email",
            verified_at: new Date(),
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          // FIX: Updated status to a valid type
          status: "active",
          // FIX: Provided all required properties for preferences
          preferences: {
            smokingAllowed: false,
            petsAllowed: false,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          // FIX: Provided all required properties for utilities
          utilities: { included: true },
        },
        {
          id: "mock-2",
          hostId: "mock-user-2",
          title: "Shared Room in Student House",
          description: "One bed available in a 4-bedroom student house.",
          price: 400,
          location: {
            address: "456 Fake Ave",
            city: "Fakeside",
            state: "KY",
            country: "USA",
            latitude: 38.0,
            longitude: -85.0,
            nearbyUniversities: [],
          },
          roomType: "shared",
          amenities: ["Wi-Fi", "Kitchen", "Parking"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-09-01"),
          availableTo: new Date("2026-05-31"),
          maxOccupants: 1,
          host: {
            id: "mock-user-2",
            name: "Mock Host 2",
            email: "mock2@example.com",
            university: "Another Mock University",
            year: "Sophomore",
            bio: "Quiet student",
            verified: true,
            student_verified: true,
            student_email: "mock2@example.edu",
            verification_status: "verified",
            verification_method: "email",
            verified_at: new Date(),
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: false,
            petsAllowed: false,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          utilities: { included: true },
        },
        {
          id: "mock-3",
          hostId: "mock-user-3",
          title: "Studio Apartment Downtown",
          description:
            "Compact studio, perfect for one person, close to city center.",
          price: 900,
          location: {
            address: "789 Downtown Ln",
            city: "Metropolis",
            state: "NY",
            country: "USA",
            latitude: 40.7,
            longitude: -74.0,
            nearbyUniversities: [],
          },
          roomType: "studio",
          amenities: ["Gym", "Pool", "Balcony"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-07-15"),
          availableTo: new Date("2026-06-30"),
          maxOccupants: 1,
          host: {
            id: "mock-user-3",
            name: "Mock Host 3",
            email: "mock3@example.com",
            university: "City Mock University",
            year: "Graduate",
            bio: "Professional",
            verified: true,
            student_verified: true,
            student_email: "mock3@example.edu",
            verification_status: "verified",
            verification_method: "email",
            verified_at: new Date(),
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: false,
            petsAllowed: false,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          utilities: { included: true },
        },
        {
          id: "mock-4",
          hostId: "mock-user-4",
          title: "Bedroom in Family Home",
          description: "Spare bedroom in a quiet family home, includes meals.",
          price: 600,
          location: {
            address: "101 Suburban Way",
            city: "Green Acres",
            state: "CA",
            country: "USA",
            latitude: 34.0,
            longitude: -118.0,
            nearbyUniversities: [],
          },
          roomType: "single", // Changed from 'private'
          amenities: ["Meals", "Garden", "Quiet"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-08-10"),
          availableTo: new Date("2026-08-09"),
          maxOccupants: 1,
          host: {
            id: "mock-user-4",
            name: "Mock Host 4",
            email: "mock4@example.com",
            university: "Rural Mock College",
            year: "Freshman",
            bio: "Lovely family",
            verified: false,
            student_verified: false,
            student_email: "mock4@example.edu",
            verification_status: "unverified",
            verification_method: undefined, // FIX: Changed null to undefined
            verified_at: undefined, // FIX: Changed null to undefined
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: false,
            petsAllowed: true,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          utilities: { included: true, cost: 50 },
        },
        {
          id: "mock-5",
          hostId: "mock-user-5",
          title: "2 Bed 2 Bath Apartment",
          description:
            "Spacious apartment suitable for sharing, modern amenities.",
          price: 1200,
          location: {
            address: "202 Urban Rd",
            city: "Big City",
            state: "TX",
            country: "USA",
            latitude: 30.0,
            longitude: -97.0,
            nearbyUniversities: [],
          },
          roomType: "apartment",
          amenities: ["Dishwasher", "Air Conditioning", "Pet Friendly"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-09-15"),
          availableTo: new Date("2026-09-14"),
          maxOccupants: 4,
          host: {
            id: "mock-user-5",
            name: "Mock Host 5",
            email: "mock5@example.com",
            university: "Mega Mock University",
            year: "Senior",
            bio: "Experienced landlord",
            verified: true,
            student_verified: true,
            student_email: "mock5@example.edu",
            verification_status: "verified",
            verification_method: "email",
            verified_at: new Date(),
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: false,
            petsAllowed: true,
            studyFriendly: false,
          },
          rules: [],
          deposit: 0,
          utilities: { included: false, cost: 100 },
        },
        {
          id: "mock-6",
          hostId: "mock-user-6",
          title: "Budget Single Room",
          description:
            "Small, affordable room ideal for a student on a tight budget.",
          price: 300,
          location: {
            address: "303 Budget St",
            city: "Lowtown",
            state: "FL",
            country: "USA",
            latitude: 28.0,
            longitude: -81.0,
            nearbyUniversities: [],
          },
          roomType: "single",
          amenities: ["Desk", "Wardrobe"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-08-05"),
          availableTo: new Date("2026-05-25"),
          maxOccupants: 1,
          host: {
            id: "mock-user-6",
            name: "Mock Host 6",
            email: "mock6@example.com",
            university: "Thrifty Mock Institute",
            year: "Freshman",
            bio: "Student on a budget",
            verified: false,
            student_verified: false,
            student_email: "mock6@example.edu",
            verification_status: "unverified",
            verification_method: undefined,
            verified_at: undefined,
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: true,
            petsAllowed: false,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          utilities: { included: true },
        },
        {
          id: "mock-7",
          hostId: "mock-user-7",
          title: "Luxury Condo with City View",
          description:
            "High-end living with stunning views and premium amenities.",
          price: 2500,
          location: {
            address: "505 Skyline Dr",
            city: "Highrise City",
            state: "IL",
            country: "USA",
            latitude: 41.8,
            longitude: -87.6,
            nearbyUniversities: [],
          },
          roomType: "apartment",
          amenities: ["Concierge", "Rooftop Pool", "Fitness Center"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-10-01"),
          availableTo: new Date("2026-09-30"),
          maxOccupants: 2,
          host: {
            id: "mock-user-7",
            name: "Mock Host 7",
            email: "mock7@example.com",
            university: "Elite Mock Academy",
            year: "Alumni",
            bio: "Luxury property owner",
            verified: true,
            student_verified: true,
            student_email: "mock7@example.edu",
            verification_status: "verified",
            verification_method: "email",
            verified_at: new Date(),
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: false,
            petsAllowed: true,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          utilities: { included: true, cost: 200 },
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: dbError } = await supabase
        .from("listings")
        .select(
          `
          *,
          profiles:host_id(
            id,
            name,
            university,
            year,
            bio,
            phone,
            verified,
            student_verified,
            student_email,
            verification_status,
            verification_method,
            verified_at,
            profile_picture,
            preferences,
            location,
            matching_preferences, /* FIX: Corrected column name from matchingPreferences to matching_preferences */
            created_at
          )
        `
        )
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (dbError) {
        throw new Error(
          `Failed to fetch listings: ${dbError.message || "Unknown error"}`
        );
      }

      const fetchedListings: Listing[] = (data || []).map((item: any) => ({
        id: item.id,
        hostId: item.host_id,
        title: item.title,
        description: item.description,
        price: item.price,
        // FIX: Ensure location from DB is mapped correctly
        location: item.location,
        roomType: item.room_type,
        amenities: item.amenities,
        images: item.images,
        availableFrom: new Date(item.available_from),
        availableTo: item.available_to
          ? new Date(item.available_to)
          : undefined,
        maxOccupants: item.max_occupants,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        status: item.status,
        preferences: item.preferences,
        rules: item.rules,
        deposit: item.deposit,
        utilities: item.utilities,
        host: {
          id: item.profiles.id,
          name: item.profiles.name,
          email: item.profiles.email,
          university: item.profiles.university,
          year: item.profiles.year,
          bio: item.profiles.bio,
          phone: item.profiles.phone,
          verified: item.profiles.verified,
          student_verified: item.profiles.student_verified,
          student_email: item.profiles.student_email,
          verification_status: item.profiles.verification_status,
          // FIX: Handle null for optional string/Date fields from DB
          verification_method: item.profiles.verification_method || undefined,
          verified_at: item.profiles.verified_at
            ? new Date(item.profiles.verified_at)
            : undefined,
          profilePicture: item.profiles.profile_picture,
          preferences: item.profiles.preferences,
          location: item.profiles.location,
          matchingPreferences: item.profiles.matching_preferences, // FIX: Mapped to matching_preferences
          createdAt: new Date(item.profiles.created_at),
        } as User,
      }));

      setListings(fetchedListings);
    } catch (err: any) {
      console.error(
        "[ListingsContext] Error occurred, falling back to mock data. Error:",
        err
      );
      setError(err.message);
      // Fallback to mock data on error too
      setListings([
        {
          id: "mock-1",
          hostId: "mock-user-1",
          title: "Mock Apartment near Campus",
          description: "A comfortable apartment with 2 bedrooms and 1 bath.",
          price: 750,
          location: {
            address: "123 Mock St",
            city: "Mockville",
            state: "OH",
            country: "USA",
            latitude: 39.123,
            longitude: -84.567,
            nearbyUniversities: [],
          },
          roomType: "apartment",
          amenities: ["Wi-Fi", "Laundry", "Furnished"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-08-01"),
          availableTo: new Date("2026-07-31"),
          maxOccupants: 2,
          host: {
            id: "mock-user-1",
            name: "Mock Host 1",
            email: "mock1@example.com",
            university: "Mock University",
            year: "Junior",
            bio: "Friendly host",
            verified: true,
            student_verified: true,
            student_email: "mock1@example.edu",
            verification_status: "verified",
            verification_method: "email",
            verified_at: new Date(),
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: false,
            petsAllowed: false,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          utilities: { included: true },
        },
        {
          id: "mock-2",
          hostId: "mock-user-2",
          title: "Shared Room in Student House",
          description: "One bed available in a 4-bedroom student house.",
          price: 400,
          location: {
            address: "456 Fake Ave",
            city: "Fakeside",
            state: "KY",
            country: "USA",
            latitude: 38.0,
            longitude: -85.0,
            nearbyUniversities: [],
          },
          roomType: "shared",
          amenities: ["Wi-Fi", "Kitchen", "Parking"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-09-01"),
          availableTo: new Date("2026-05-31"),
          maxOccupants: 1,
          host: {
            id: "mock-user-2",
            name: "Mock Host 2",
            email: "mock2@example.com",
            university: "Another Mock University",
            year: "Sophomore",
            bio: "Quiet student",
            verified: true,
            student_verified: true,
            student_email: "mock2@example.edu",
            verification_status: "verified",
            verification_method: "email",
            verified_at: new Date(),
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: false,
            petsAllowed: false,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          utilities: { included: true },
        },
        {
          id: "mock-3",
          hostId: "mock-user-3",
          title: "Studio Apartment Downtown",
          description:
            "Compact studio, perfect for one person, close to city center.",
          price: 900,
          location: {
            address: "789 Downtown Ln",
            city: "Metropolis",
            state: "NY",
            country: "USA",
            latitude: 40.7,
            longitude: -74.0,
            nearbyUniversities: [],
          },
          roomType: "studio",
          amenities: ["Gym", "Pool", "Balcony"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-07-15"),
          availableTo: new Date("2026-06-30"),
          maxOccupants: 1,
          host: {
            id: "mock-user-3",
            name: "Mock Host 3",
            email: "mock3@example.com",
            university: "City Mock University",
            year: "Graduate",
            bio: "Professional",
            verified: true,
            student_verified: true,
            student_email: "mock3@example.edu",
            verification_status: "verified",
            verification_method: "email",
            verified_at: new Date(),
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: false,
            petsAllowed: false,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          utilities: { included: true },
        },
        {
          id: "mock-4",
          hostId: "mock-user-4",
          title: "Bedroom in Family Home",
          description: "Spare bedroom in a quiet family home, includes meals.",
          price: 600,
          location: {
            address: "101 Suburban Way",
            city: "Green Acres",
            state: "CA",
            country: "USA",
            latitude: 34.0,
            longitude: -118.0,
            nearbyUniversities: [],
          },
          roomType: "single",
          amenities: ["Meals", "Garden", "Quiet"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-08-10"),
          availableTo: new Date("2026-08-09"),
          maxOccupants: 1,
          host: {
            id: "mock-user-4",
            name: "Mock Host 4",
            email: "mock4@example.com",
            university: "Rural Mock College",
            year: "Freshman",
            bio: "Lovely family",
            verified: false,
            student_verified: false,
            student_email: "mock4@example.edu",
            verification_status: "unverified",
            verification_method: undefined,
            verified_at: undefined,
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: false,
            petsAllowed: true,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          utilities: { included: true, cost: 50 },
        },
        {
          id: "mock-5",
          hostId: "mock-user-5",
          title: "2 Bed 2 Bath Apartment",
          description:
            "Spacious apartment suitable for sharing, modern amenities.",
          price: 1200,
          location: {
            address: "202 Urban Rd",
            city: "Big City",
            state: "TX",
            country: "USA",
            latitude: 30.0,
            longitude: -97.0,
            nearbyUniversities: [],
          },
          roomType: "apartment",
          amenities: ["Dishwasher", "Air Conditioning", "Pet Friendly"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-09-15"),
          availableTo: new Date("2026-09-14"),
          maxOccupants: 4,
          host: {
            id: "mock-user-5",
            name: "Mock Host 5",
            email: "mock5@example.com",
            university: "Mega Mock University",
            year: "Senior",
            bio: "Experienced landlord",
            verified: true,
            student_verified: true,
            student_email: "mock5@example.edu",
            verification_status: "verified",
            verification_method: "email",
            verified_at: new Date(),
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: false,
            petsAllowed: true,
            studyFriendly: false,
          },
          rules: [],
          deposit: 0,
          utilities: { included: false, cost: 100 },
        },
        {
          id: "mock-6",
          hostId: "mock-user-6",
          title: "Budget Single Room",
          description:
            "Small, affordable room ideal for a student on a tight budget.",
          price: 300,
          location: {
            address: "303 Budget St",
            city: "Lowtown",
            state: "FL",
            country: "USA",
            latitude: 28.0,
            longitude: -81.0,
            nearbyUniversities: [],
          },
          roomType: "single",
          amenities: ["Desk", "Wardrobe"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-08-05"),
          availableTo: new Date("2026-05-25"),
          maxOccupants: 1,
          host: {
            id: "mock-user-6",
            name: "Mock Host 6",
            email: "mock6@example.com",
            university: "Thrifty Mock Institute",
            year: "Freshman",
            bio: "Student on a budget",
            verified: false,
            student_verified: false,
            student_email: "mock6@example.edu",
            verification_status: "unverified",
            verification_method: undefined,
            verified_at: undefined,
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: true,
            petsAllowed: false,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          utilities: { included: true },
        },
        {
          id: "mock-7",
          hostId: "mock-user-7",
          title: "Luxury Condo with City View",
          description:
            "High-end living with stunning views and premium amenities.",
          price: 2500,
          location: {
            address: "505 Skyline Dr",
            city: "Highrise City",
            state: "IL",
            country: "USA",
            latitude: 41.8,
            longitude: -87.6,
            nearbyUniversities: [],
          },
          roomType: "apartment",
          amenities: ["Concierge", "Rooftop Pool", "Fitness Center"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-10-01"),
          availableTo: new Date("2026-09-30"),
          maxOccupants: 2,
          host: {
            id: "mock-user-7",
            name: "Mock Host 7",
            email: "mock7@example.com",
            university: "Elite Mock Academy",
            year: "Alumni",
            bio: "Luxury property owner",
            verified: true,
            student_verified: true,
            student_email: "mock7@example.edu",
            verification_status: "verified",
            verification_method: "email",
            verified_at: new Date(),
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: false,
            petsAllowed: true,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          utilities: { included: true, cost: 200 },
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: dbError } = await supabase
        .from("listings")
        .select(
          `
          *,
          profiles:host_id(
            id,
            name,
            university,
            year,
            bio,
            phone,
            verified,
            student_verified,
            student_email,
            verification_status,
            verification_method,
            verified_at,
            profile_picture,
            preferences,
            location,
            matching_preferences, /* FIX: Corrected column name from matchingPreferences to matching_preferences */
            created_at
          )
        `
        )
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (dbError) {
        throw new Error(
          `Failed to fetch listings: ${dbError.message || "Unknown error"}`
        );
      }

      const fetchedListings: Listing[] = (data || []).map((item: any) => ({
        id: item.id,
        hostId: item.host_id,
        title: item.title,
        description: item.description,
        price: item.price,
        location: item.location, // Location from DB
        roomType: item.room_type,
        amenities: item.amenities,
        images: item.images,
        availableFrom: new Date(item.available_from),
        availableTo: item.available_to
          ? new Date(item.available_to)
          : undefined,
        maxOccupants: item.max_occupants,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        status: item.status,
        preferences: item.preferences,
        rules: item.rules,
        deposit: item.deposit,
        utilities: item.utilities,
        host: {
          id: item.profiles.id,
          name: item.profiles.name,
          email: item.profiles.email,
          university: item.profiles.university,
          year: item.profiles.year,
          bio: item.profiles.bio,
          phone: item.profiles.phone,
          verified: item.profiles.verified,
          student_verified: item.profiles.student_verified,
          student_email: item.profiles.student_email,
          verification_status: item.profiles.verification_status,
          verification_method: item.profiles.verification_method || undefined, // Handle null from DB
          verified_at: item.profiles.verified_at
            ? new Date(item.profiles.verified_at)
            : undefined, // Handle null from DB
          profilePicture: item.profiles.profile_picture,
          preferences: item.profiles.preferences,
          location: item.profiles.location,
          matchingPreferences: item.profiles.matching_preferences, // Mapped to matching_preferences
          createdAt: new Date(item.profiles.created_at),
        } as User,
      }));

      setListings(fetchedListings);
    } catch (err: any) {
      console.error(
        "[ListingsContext] Error occurred, falling back to mock data. Error:",
        err
      );
      setError(err.message);
      setListings([
        {
          id: "mock-1",
          hostId: "mock-user-1",
          title: "Mock Apartment near Campus",
          description: "A comfortable apartment with 2 bedrooms and 1 bath.",
          price: 750,
          location: {
            address: "123 Mock St",
            city: "Mockville",
            state: "OH",
            country: "USA",
            latitude: 39.123,
            longitude: -84.567,
            nearbyUniversities: [],
          },
          roomType: "apartment",
          amenities: ["Wi-Fi", "Laundry", "Furnished"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-08-01"),
          availableTo: new Date("2026-07-31"),
          maxOccupants: 2,
          host: {
            id: "mock-user-1",
            name: "Mock Host 1",
            email: "mock1@example.com",
            university: "Mock University",
            year: "Junior",
            bio: "Friendly host",
            verified: true,
            student_verified: true,
            student_email: "mock1@example.edu",
            verification_status: "verified",
            verification_method: "email",
            verified_at: new Date(),
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: false,
            petsAllowed: false,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          utilities: { included: true },
        },
        {
          id: "mock-2",
          hostId: "mock-user-2",
          title: "Shared Room in Student House",
          description: "One bed available in a 4-bedroom student house.",
          price: 400,
          location: {
            address: "456 Fake Ave",
            city: "Fakeside",
            state: "KY",
            country: "USA",
            latitude: 38.0,
            longitude: -85.0,
            nearbyUniversities: [],
          },
          roomType: "shared",
          amenities: ["Wi-Fi", "Kitchen", "Parking"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-09-01"),
          availableTo: new Date("2026-05-31"),
          maxOccupants: 1,
          host: {
            id: "mock-user-2",
            name: "Mock Host 2",
            email: "mock2@example.com",
            university: "Another Mock University",
            year: "Sophomore",
            bio: "Quiet student",
            verified: true,
            student_verified: true,
            student_email: "mock2@example.edu",
            verification_status: "verified",
            verification_method: "email",
            verified_at: new Date(),
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: false,
            petsAllowed: false,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          utilities: { included: true },
        },
        {
          id: "mock-3",
          hostId: "mock-user-3",
          title: "Studio Apartment Downtown",
          description:
            "Compact studio, perfect for one person, close to city center.",
          price: 900,
          location: {
            address: "789 Downtown Ln",
            city: "Metropolis",
            state: "NY",
            country: "USA",
            latitude: 40.7,
            longitude: -74.0,
            nearbyUniversities: [],
          },
          roomType: "studio",
          amenities: ["Gym", "Pool", "Balcony"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-07-15"),
          availableTo: new Date("2026-06-30"),
          maxOccupants: 1,
          host: {
            id: "mock-user-3",
            name: "Mock Host 3",
            email: "mock3@example.com",
            university: "City Mock University",
            year: "Graduate",
            bio: "Professional",
            verified: true,
            student_verified: true,
            student_email: "mock3@example.edu",
            verification_status: "verified",
            verification_method: "email",
            verified_at: new Date(),
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: false,
            petsAllowed: false,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          utilities: { included: true },
        },
        {
          id: "mock-4",
          hostId: "mock-user-4",
          title: "Bedroom in Family Home",
          description: "Spare bedroom in a quiet family home, includes meals.",
          price: 600,
          location: {
            address: "101 Suburban Way",
            city: "Green Acres",
            state: "CA",
            country: "USA",
            latitude: 34.0,
            longitude: -118.0,
            nearbyUniversities: [],
          },
          roomType: "single",
          amenities: ["Meals", "Garden", "Quiet"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-08-10"),
          availableTo: new Date("2026-08-09"),
          maxOccupants: 1,
          host: {
            id: "mock-user-4",
            name: "Mock Host 4",
            email: "mock4@example.com",
            university: "Rural Mock College",
            year: "Freshman",
            bio: "Lovely family",
            verified: false,
            student_verified: false,
            student_email: "mock4@example.edu",
            verification_status: "unverified",
            verification_method: undefined,
            verified_at: undefined,
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: false,
            petsAllowed: true,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          utilities: { included: true, cost: 50 },
        },
        {
          id: "mock-5",
          hostId: "mock-user-5",
          title: "2 Bed 2 Bath Apartment",
          description:
            "Spacious apartment suitable for sharing, modern amenities.",
          price: 1200,
          location: {
            address: "202 Urban Rd",
            city: "Big City",
            state: "TX",
            country: "USA",
            latitude: 30.0,
            longitude: -97.0,
            nearbyUniversities: [],
          },
          roomType: "apartment",
          amenities: ["Dishwasher", "Air Conditioning", "Pet Friendly"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-09-15"),
          availableTo: new Date("2026-09-14"),
          maxOccupants: 4,
          host: {
            id: "mock-user-5",
            name: "Mock Host 5",
            email: "mock5@example.com",
            university: "Mega Mock University",
            year: "Senior",
            bio: "Experienced landlord",
            verified: true,
            student_verified: true,
            student_email: "mock5@example.edu",
            verification_status: "verified",
            verification_method: "email",
            verified_at: new Date(),
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: false,
            petsAllowed: true,
            studyFriendly: false,
          },
          rules: [],
          deposit: 0,
          utilities: { included: false, cost: 100 },
        },
        {
          id: "mock-6",
          hostId: "mock-user-6",
          title: "Budget Single Room",
          description:
            "Small, affordable room ideal for a student on a tight budget.",
          price: 300,
          location: {
            address: "303 Budget St",
            city: "Lowtown",
            state: "FL",
            country: "USA",
            latitude: 28.0,
            longitude: -81.0,
            nearbyUniversities: [],
          },
          roomType: "single",
          amenities: ["Desk", "Wardrobe"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-08-05"),
          availableTo: new Date("2026-05-25"),
          maxOccupants: 1,
          host: {
            id: "mock-user-6",
            name: "Mock Host 6",
            email: "mock6@example.com",
            university: "Thrifty Mock Institute",
            year: "Freshman",
            bio: "Student on a budget",
            verified: false,
            student_verified: false,
            student_email: "mock6@example.edu",
            verification_status: "unverified",
            verification_method: undefined,
            verified_at: undefined,
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: true,
            petsAllowed: false,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          utilities: { included: true },
        },
        {
          id: "mock-7",
          hostId: "mock-user-7",
          title: "Luxury Condo with City View",
          description:
            "High-end living with stunning views and premium amenities.",
          price: 2500,
          location: {
            address: "505 Skyline Dr",
            city: "Highrise City",
            state: "IL",
            country: "USA",
            latitude: 41.8,
            longitude: -87.6,
            nearbyUniversities: [],
          },
          roomType: "apartment",
          amenities: ["Concierge", "Rooftop Pool", "Fitness Center"],
          images: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          availableFrom: new Date("2025-10-01"),
          availableTo: new Date("2026-09-30"),
          maxOccupants: 2,
          host: {
            id: "mock-user-7",
            name: "Mock Host 7",
            email: "mock7@example.com",
            university: "Elite Mock Academy",
            year: "Alumni",
            bio: "Luxury property owner",
            verified: true,
            student_verified: true,
            student_email: "mock7@example.edu",
            verification_status: "verified",
            verification_method: "email",
            verified_at: new Date(),
            createdAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          preferences: {
            smokingAllowed: false,
            petsAllowed: true,
            studyFriendly: true,
          },
          rules: [],
          deposit: 0,
          utilities: { included: true, cost: 200 },
        },
      ]); // Fallback to mock data with proper count
    } finally {
      setIsLoading(false);
    }
  }, [isSupabaseReady, isOnline, lastFetchTime]);

  const generateRecommendations = useCallback(() => {
    if (!user || listings.length === 0) {
      console.log(
        "[ListingsContext] No user or listings to generate recommendations."
      );
      setRecommendedListings([]);
      return;
    }

    console.log(
      "[ListingsContext] Generating recommendations for user:",
      user.university
    );
    const scoredListings = listings
      .map((listing) => ({
        listing,
        score: MatchingService.calculateMatchScore(user, listing),
      }))
      .sort((a, b) => b.score - a.score);

    setRecommendedListings(scoredListings.map((sl) => sl.listing));
    console.log(
      "[ListingsContext] Generated recommendations count:",
      scoredListings.length
    );
  }, [user, listings]);

  useEffect(() => {
    fetchListings();
    // Add loading timeout protection
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn("[ListingsContext] Loading timeout reached, forcing stop");
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [fetchListings]);

  // Regenerate recommendations whenever user or listings change
  useEffect(() => {
    generateRecommendations();
  }, [user, listings, generateRecommendations]);

  // Handle tab visibility changes to refresh listings
  useTabVisibility({
    onVisible: () => {
      console.log("[ListingsContext] Tab became visible, refreshing listings");
      if (!isLoading) {
        fetchListings().catch(console.error);
      }
    },
    onFocus: () => {
      console.log("[ListingsContext] Window focused");
      // Clear any stuck loading states after 30 seconds
      setTimeout(() => {
        if (isLoading) {
          console.warn(
            "[ListingsContext] Forcing loading state to false after timeout"
          );
          setIsLoading(false);
        }
      }, 30000);
    },
  });

  const value = {
    listings,
    isLoading,
    error,
    fetchListings,
    recommendedListings,
    filters,
    setFilters,
    sortBy,
    setSortBy,
  };

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  );
};
