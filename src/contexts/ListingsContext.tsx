import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { Listing, SearchFilters, User } from "../types"; // User imported
import { mockListings } from "../data/mockData"; // Imported mockListings
import MatchingService from "../lib/matching"; // Imported MatchingService
import { errorHandler } from "../lib/errorHandler"; // Imported errorHandler
import { performanceMonitor } from "../lib/performance"; // Imported performanceMonitor
import { updateListingsWithRealAddresses } from "../lib/realAddressIntegration"; // Imported updateListingsWithRealAddresses
import { calculateDistance } from "../utils/haversine"; // Imported calculateDistance
import { universityData, getNearbyUniversities } from "../data/universities"; // Imported universityData, getNearbyUniversities
import { useTabVisibility } from "../hooks/useTabVisibility";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

interface ListingsContextType {
  listings: Listing[];
  filteredListings: Listing[];
  recommendedListings: Listing[];
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  addListing: (
    listing: Omit<Listing, "id" | "createdAt" | "updatedAt" | "host">
  ) => Promise<void>;
  updateListing: (id: string, updates: Partial<Listing>) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  favoriteListings: string[];
  toggleFavorite: (listingId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refreshListings: () => Promise<void>;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  universitySuggestions: string[];
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
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [recommendedListings, setRecommendedListings] = useState<Listing[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [favoriteListings, setFavoriteListings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("relevance");
  const isOnline = useOnlineStatus();
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Memoized university suggestions for the filter dropdowns
  const universitySuggestions = useMemo(() => {
    const universities = new Set<string>();

    // Add universities from fetched listings
    listings.forEach((listing) => {
      if (
        listing.host?.university &&
        listing.host.university !== "Not specified"
      ) {
        universities.add(listing.host.university);
      }
      listing.location?.nearbyUniversities?.forEach((uni) => {
        universities.add(uni.name);
      });
    });

    // Add user's university if available
    if (user?.university && user.university !== "Not specified") {
      universities.add(user.university);
    }

    // Add universities from the static list as a fallback
    universityData.forEach((uni) => universities.add(uni.name));

    return Array.from(universities).sort();
  }, [listings, user]);

  /**
   * Refreshes the list of listings, either from mock data or Supabase.
   * Also populates nearby universities and handles coordinate validation.
   */
  const refreshListings = useCallback(async () => {
    // Renamed from fetchListings
    // Throttle rapid successive calls
    const now = Date.now();
    if (now - lastFetchTime < 5000 && lastFetchTime !== 0) {
      return;
    }
    setLastFetchTime(now);

    setIsLoading(true);
    setError(null);

    // In production, only use real data from Supabase
    // In development, fall back to mock data if needed
    if (!isSupabaseReady || !isOnline) {
      if (import.meta.env.DEV) {
        // Development: Use mock data as fallback
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate loading
        const listingsWithRealAddresses =
          updateListingsWithRealAddresses(mockListings);
        setListings(listingsWithRealAddresses);
      } else {
        // Production: Show empty state, don't use mock data
        setListings([]);
        setError(
          "Unable to connect to the server. Please check your internet connection and try again."
        );
      }
      setIsLoading(false);
      return;
    }

    const startTime = performance.now();

    try {
      // Fetch listings and their host profiles from Supabase
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
            matching_preferences,
            created_at
          )
        `
        )
        .eq("status", "active") // Only fetch active listings
        .order("created_at", { ascending: false });

      performanceMonitor.recordMetric(
        // Using performanceMonitor
        "listings_fetch_time",
        performance.now() - startTime
      );

      if (dbError) {
        throw new Error(
          `Failed to fetch listings: ${dbError.message || "Unknown error"}`
        );
      }

      const fetchedListings: Listing[] = (data || [])
        .map((item: any): Listing | null => {
          try {
            const latitude = item.location?.latitude;
            const longitude = item.location?.longitude;

            let nearbyUniversities: { name: string; distance: number }[] = [];
            // Only calculate nearby universities if valid coordinates are present
            if (
              typeof latitude === "number" &&
              latitude !== 0 &&
              typeof longitude === "number" &&
              longitude !== 0
            ) {
              nearbyUniversities = getNearbyUniversities(
                { lat: latitude, lng: longitude },
                50 // 50 miles radius
              );
            } else {
              // Skip nearby universities calculation for invalid coordinates
            }

            return {
              id: item.id,
              hostId: item.host_id,
              title: item.title || "Untitled Listing",
              description: item.description || "",
              price: typeof item.price === "number" ? item.price : 0,
              location: {
                address: item.location?.address || "Unknown Address",
                city: item.location?.city || "Unknown",
                state: item.location?.state || "Unknown",
                country: item.location?.country || "USA",
                latitude: typeof latitude === "number" ? latitude : 0,
                longitude: typeof longitude === "number" ? longitude : 0,
                nearbyUniversities: nearbyUniversities,
              },
              roomType: item.room_type || "single",
              amenities: Array.isArray(item.amenities) ? item.amenities : [], // Ensure array
              images: Array.isArray(item.images) ? item.images : [], // Ensure array
              availableFrom: item.available_from
                ? new Date(item.available_from)
                : new Date(),
              availableTo: item.available_to
                ? new Date(item.available_to)
                : undefined,
              maxOccupants:
                typeof item.max_occupants === "number" ? item.max_occupants : 1,
              createdAt: item.created_at
                ? new Date(item.created_at)
                : new Date(),
              updatedAt: item.updated_at
                ? new Date(item.updated_at)
                : new Date(),
              status: item.status || "active",
              preferences: item.preferences || {}, // Ensure preferences are an object
              rules: Array.isArray(item.rules) ? item.rules : [], // Ensure array
              deposit:
                typeof item.deposit === "number" ? item.deposit : undefined,
              utilities: item.utilities || {}, // Ensure utilities are an object
              host: {
                id: item.profiles?.id || item.host_id,
                name: item.profiles?.name || "Unknown Host",
                email: item.profiles?.email || "",
                university: item.profiles?.university || "Not specified",
                year: item.profiles?.year || "Not specified",
                bio: item.profiles?.bio || "",
                phone: item.profiles?.phone || undefined,
                verified: Boolean(item.profiles?.verified),
                student_verified: Boolean(item.profiles?.student_verified),
                student_email: item.profiles?.student_email || undefined,
                verification_status:
                  item.profiles?.verification_status || "unverified",
                verification_method:
                  item.profiles?.verification_method || undefined,
                verified_at: item.profiles?.verified_at
                  ? new Date(item.profiles.verified_at)
                  : undefined,
                profilePicture: item.profiles?.profile_picture || undefined,
                preferences: item.profiles?.preferences || {},
                location: item.profiles?.location || {
                  address: "",
                  city: "",
                  state: "",
                  country: "",
                  coordinates: { lat: 0, lng: 0 },
                },
                matchingPreferences: item.profiles?.matching_preferences || {
                  maxDistance: 0,
                  sameUniversity: false,
                  similarYear: false,
                  budgetRange: { min: 0, max: 0 },
                }, // Ensure default structure
                createdAt: item.profiles?.created_at
                  ? new Date(item.profiles.created_at)
                  : new Date(),
              } as User,
            };
          } catch (itemError) {
            errorHandler.logError(
              new Error(`Error formatting listing ${item.id}: ${itemError}`)
            );
            return null; // Return null for problematic listings
          }
        })
        .filter((listing): listing is Listing => listing !== null); // Filter out nulls

      setListings(fetchedListings);
    } catch (err: any) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch listings";
      setError(errorMessage);
      errorHandler.logError(new Error(errorMessage));

      console.error(
        "[ListingsContext] Error occurred while fetching listings. Error:",
        errorMessage
      );

      // In production, don't fall back to mock data
      if (import.meta.env.DEV) {
        setListings(updateListingsWithRealAddresses(mockListings));
      } else {
        setListings([]); // Empty state in production
      }
    } finally {
      setIsLoading(false);
    }
  }, [isSupabaseReady, isOnline, lastFetchTime]); // Added dependencies

  /**
   * Fetches favorite listings for the current user.
   */
  const fetchFavorites = useCallback(async () => {
    // Added back
    if (!user) return;

    try {
      if (!isSupabaseReady) {
        const storedFavorites = localStorage.getItem("uninest_favorites");
        if (storedFavorites) {
          try {
            const parsed = JSON.parse(storedFavorites);
            setFavoriteListings(Array.isArray(parsed) ? parsed : []);
          } catch (error: any) {
            errorHandler.logError(
              new Error(
                `[ListingsContext] Error parsing stored favorites: ${error.message}`
              )
            );
            setFavoriteListings([]);
          }
        }
        return;
      }

      const { data, error } = await supabase
        .from("favorites")
        .select("listing_id")
        .eq("user_id", user.id);

      if (error) {
        throw new Error(`Failed to fetch favorites: ${error.message}`);
      }

      setFavoriteListings((data || []).map((fav: any) => fav.listing_id));
    } catch (error: any) {
      errorHandler.logError(
        new Error(
          `[ListingsContext] Error fetching favorites: ${error.message}`
        )
      );
      setFavoriteListings([]);
    }
  }, [user, isSupabaseReady]);

  /**
   * Applies current filters and sorting preferences to the listings.
   */
  const applyFiltersAndSorting = useCallback(() => {
    // Added back
    try {
      let currentFilteredListings = [...listings];

      // Apply search query filter
      if (filters.query) {
        const searchTerm = filters.query.toLowerCase();
        currentFilteredListings = currentFilteredListings.filter(
          (listing) =>
            listing.title.toLowerCase().includes(searchTerm) ||
            listing.description.toLowerCase().includes(searchTerm) ||
            listing.location.city.toLowerCase().includes(searchTerm)
        );
      }

      // Apply location filter (city, address, or zip code in text search)
      if (filters.location) {
        const searchTerm = filters.location.toLowerCase();
        currentFilteredListings = currentFilteredListings.filter((listing) => {
          const location = listing.location || {};
          return (
            (location.city || "").toLowerCase().includes(searchTerm) ||
            (location.address || "").toLowerCase().includes(searchTerm) ||
            (location.nearbyUniversities || []).some((uni) =>
              uni.name.toLowerCase().includes(searchTerm)
            )
          );
        });
      }

      // University Filter
      if (filters.university) {
        const universityToFilter =
          typeof filters.university === "object" && filters.university !== null
            ? filters.university.custom
            : (filters.university as string);

        if (universityToFilter) {
          const lowercasedUniversity = universityToFilter.toLowerCase();
          currentFilteredListings = currentFilteredListings.filter(
            (listing) => {
              const hostUniversityMatch =
                listing.host?.university?.toLowerCase() ===
                lowercasedUniversity;

              const nearbyUniversityMatch = (
                listing.location?.nearbyUniversities || []
              ) // Ensure it's an array
                .some((uni) => uni.name.toLowerCase() === lowercasedUniversity);

              return hostUniversityMatch || nearbyUniversityMatch;
            }
          );
        }
      }

      // Max Distance Filter (from user's location)
      if (
        filters.maxDistance !== undefined &&
        user?.location?.coordinates?.lat !== undefined &&
        user?.location?.coordinates?.lng !== undefined &&
        (user.location.coordinates.lat !== 0 ||
          user.location.coordinates.lng !== 0)
      ) {
        const userCoordinates = user.location.coordinates;
        currentFilteredListings = currentFilteredListings.filter((listing) => {
          if (
            !listing.location?.latitude ||
            !listing.location?.longitude ||
            (listing.location.latitude === 0 &&
              listing.location.longitude === 0)
          ) {
            return false; // Exclude listings with invalid/zero coordinates
          }

          const distance = calculateDistance(
            userCoordinates.lat,
            userCoordinates.lng,
            listing.location.latitude,
            listing.location.longitude
          );
          return distance <= filters.maxDistance!;
        });
      }

      // Price Range Filter
      if (filters.priceRange) {
        currentFilteredListings = currentFilteredListings.filter((listing) => {
          const price = listing.price || 0;
          const minPrice = filters.priceRange?.min ?? 0;
          const maxPrice = filters.priceRange?.max ?? Infinity;
          return price >= minPrice && price <= maxPrice;
        });
      }

      // Room Type Filter
      if (filters.roomType && filters.roomType.length > 0) {
        currentFilteredListings = currentFilteredListings.filter((listing) =>
          filters.roomType!.includes(listing.roomType)
        );
      }

      // Amenities Filter
      if (filters.amenities && filters.amenities.length > 0) {
        currentFilteredListings = currentFilteredListings.filter((listing) =>
          filters.amenities!.every(
            (amenity) => (listing.amenities || []).includes(amenity) // Ensure array for listing.amenities
          )
        );
      }

      // Available From (Move-in Date) Filter
      if (filters.availableFrom instanceof Date) {
        currentFilteredListings = currentFilteredListings.filter(
          (listing) =>
            listing.availableFrom &&
            listing.availableFrom.getTime() >= filters.availableFrom!.getTime()
        );
      }

      // Move-in Date (string from input) Filter
      if (filters.moveInDate) {
        const filterDate = new Date(filters.moveInDate);
        currentFilteredListings = currentFilteredListings.filter(
          (listing) =>
            listing.availableFrom &&
            listing.availableFrom.getTime() <= filterDate.getTime()
        );
      }

      // Apply user-based filtering (e.g., exclude own listings) if user is logged in
      if (user) {
        currentFilteredListings = currentFilteredListings.filter(
          (listing) => listing.hostId !== user.id
        );

        // Apply sorting with user context (relevance, match, distance, etc.)
        currentFilteredListings = MatchingService.sortListings(
          currentFilteredListings,
          sortBy,
          user
        );
      } else {
        // Default sorting for non-logged-in users
        switch (sortBy) {
          case "price-asc":
            currentFilteredListings.sort(
              (a, b) => (a.price || 0) - (b.price || 0)
            );
            break;
          case "price-desc":
            currentFilteredListings.sort(
              (a, b) => (b.price || 0) - (a.price || 0)
            );
            break;
          case "newest":
            currentFilteredListings.sort((a, b) => {
              const timeA = a.createdAt ? a.createdAt.getTime() : 0;
              const timeB = b.createdAt ? b.createdAt.getTime() : 0;
              return timeB - timeA;
            });
            break;
          default:
            // Keep current order if no specific sort or user is not logged in
            break;
        }
      }

      console.log(
        "[ListingsContext] Filtered listings count:",
        currentFilteredListings.length
      );
      setFilteredListings(currentFilteredListings);
    } catch (error: any) {
      errorHandler.logError(
        new Error(`[ListingsContext] Error applying filters: ${error.message}`)
      );
      setFilteredListings(listings); // Fallback to all listings on filter error
    }
  }, [listings, filters, sortBy, user]); // Added dependencies

  /**
   * Generates personalized listing recommendations for the current user.
   */
  const generateRecommendations = useCallback(() => {
    if (!user || listings.length === 0) {
      console.log(
        "[ListingsContext] No user or listings to generate recommendations."
      );
      setRecommendedListings([]);
      return;
    }

    try {
      console.log(
        "[ListingsContext] Generating recommendations for user:",
        user.university
      );
      // Ensure relevance and match scores are calculated for each listing
      const listingsWithScores = listings.map((listing) => ({
        ...listing,
        matchScore: MatchingService.calculateMatchScore(user, listing),
        relevanceScore: MatchingService.calculateRelevanceScore(user, listing),
      }));

      const recommendations = MatchingService.getRecommendations(
        user,
        listingsWithScores,
        6 // Limit to 6 recommendations for display
      );
      console.log(
        "[ListingsContext] Generated recommendations count:",
        recommendations.length
      );
      setRecommendedListings(recommendations);
    } catch (error: any) {
      errorHandler.logError(
        new Error(
          `[ListingsContext] Error generating recommendations: ${error.message}`
        )
      );
      setRecommendedListings([]); // Clear recommendations on error
    }
  }, [user, listings]); // Added dependencies

  /**
   * Adds a new listing to the database or mock data.
   */
  const addListing = useCallback(
    // Added back
    async (
      newListing: Omit<Listing, "id" | "createdAt" | "updatedAt" | "host">
    ) => {
      if (!user) throw new Error("User must be logged in to create a listing.");

      try {
        if (!isSupabaseReady) {
          // Mock add listing for development
          const listing: Listing = {
            ...newListing,
            id: Date.now().toString(),
            host: user, // Assign current user as host
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setListings((prev) => [listing, ...prev]); // Add to beginning of list
          return;
        }

        // Insert new listing into Supabase
        const { error } = await supabase
          .from("listings")
          .insert({
            title: newListing.title,
            description: newListing.description,
            price: newListing.price,
            location: newListing.location,
            room_type: newListing.roomType,
            amenities: newListing.amenities,
            images: newListing.images,
            available_from: newListing.availableFrom.toISOString(),
            available_to: newListing.availableTo?.toISOString() || null,
            max_occupants: newListing.maxOccupants,
            host_id: user.id,
            status: newListing.status,
            preferences: newListing.preferences,
            rules: newListing.rules,
            deposit: newListing.deposit,
            utilities: newListing.utilities,
          })
          .select()
          .single();

        if (error) throw error;

        await refreshListings(); // Refresh all listings to include the new one
      } catch (error: any) {
        const errorMessage = error.message || "Failed to create listing";
        errorHandler.logError(
          new Error(`[ListingsContext] Add listing failed: ${errorMessage}`)
        );
        throw new Error(errorMessage);
      }
    },
    [user, isSupabaseReady, refreshListings]
  );

  /**
   * Updates an existing listing in the database or mock data.
   */
  const updateListing = useCallback(
    // Added back
    async (id: string, updates: Partial<Listing>) => {
      try {
        if (!isSupabaseReady) {
          // Mock update listing for development
          setListings((prev) =>
            prev.map((listing) =>
              listing.id === id
                ? { ...listing, ...updates, updatedAt: new Date() }
                : listing
            )
          );
          return;
        }

        // Update listing in Supabase
        const { error } = await supabase
          .from("listings")
          .update({
            title: updates.title,
            description: updates.description,
            price: updates.price,
            location: updates.location,
            room_type: updates.roomType,
            amenities: updates.amenities,
            images: updates.images,
            available_from: updates.availableFrom?.toISOString() || undefined,
            available_to: updates.availableTo?.toISOString() || null,
            max_occupants: updates.maxOccupants,
            status: updates.status,
            preferences: updates.preferences,
            rules: updates.rules,
            deposit: updates.deposit,
            utilities: updates.utilities,
          })
          .eq("id", id);

        if (error) throw error;

        await refreshListings(); // Refresh all listings after update
      } catch (error: any) {
        const errorMessage = error.message || "Failed to update listing";
        errorHandler.logError(
          new Error(`[ListingsContext] Update listing failed: ${errorMessage}`)
        );
        throw new Error(errorMessage);
      }
    },
    [isSupabaseReady, refreshListings]
  );

  /**
   * Deletes a listing from the database or mock data.
   */
  const deleteListing = useCallback(
    // Added back
    async (id: string) => {
      try {
        if (!isSupabaseReady) {
          // Mock delete listing for development
          setListings((prev) => prev.filter((listing) => listing.id !== id));
          return;
        }

        // Delete from Supabase
        const { error } = await supabase.from("listings").delete().eq("id", id);

        if (error) throw error;

        await refreshListings(); // Refresh all listings after deletion
      } catch (error: any) {
        const errorMessage = error.message || "Failed to delete listing";
        errorHandler.logError(
          new Error(`[ListingsContext] Delete listing failed: ${errorMessage}`)
        );
        throw new Error(errorMessage);
      }
    },
    [isSupabaseReady, refreshListings]
  );

  /**
   * Toggles a listing as a favorite for the current user.
   */
  const toggleFavorite = useCallback(
    // Added back
    async (listingId: string) => {
      if (!user) {
        console.warn(
          "[ListingsContext] User not logged in. Cannot toggle favorite."
        );
        return;
      }

      const isFavorite = favoriteListings.includes(listingId);

      try {
        if (!isSupabaseReady) {
          console.log(
            "[ListingsContext] Mock toggle favorite for development."
          );
          const updated = isFavorite
            ? favoriteListings.filter((id) => id !== listingId)
            : [...favoriteListings, listingId];

          setFavoriteListings(updated);
          localStorage.setItem("uninest_favorites", JSON.stringify(updated));
          return;
        }

        // Perform Supabase favorite toggle
        if (isFavorite) {
          const { error } = await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("listing_id", listingId);

          if (error) throw error;

          setFavoriteListings((prev) => prev.filter((id) => id !== listingId));
        } else {
          const { error } = await supabase.from("favorites").insert({
            user_id: user.id,
            listing_id: listingId,
          });

          if (error) throw error;

          setFavoriteListings((prev) => [...prev, listingId]);
        }
      } catch (error: any) {
        errorHandler.logError(
          new Error(
            `[ListingsContext] Error toggling favorite: ${error.message}`
          )
        );
      }
    },
    [user, favoriteListings, isSupabaseReady]
  );

  // Effects for data loading and filtering
  useEffect(() => {
    refreshListings(); // Initial fetch of listings
  }, [refreshListings]);

  useEffect(() => {
    if (user) {
      fetchFavorites(); // Fetch favorites when user changes (logs in/out)
    } else {
      setFavoriteListings([]); // Clear favorites if user logs out
    }
  }, [user, fetchFavorites]); // Depend on user and fetchFavorites

  useEffect(() => {
    // Apply filters and sorting whenever listings data, filters, or sort preferences change
    if (listings.length > 0 || !isLoading) {
      // Only apply if listings are loaded or loading has finished
      performanceMonitor.measureFunction("apply_filters_and_sorting", () => {
        applyFiltersAndSorting();
      });
    }
  }, [applyFiltersAndSorting, listings, isLoading, filters, sortBy]); // Added 'listings' to dependencies

  useEffect(() => {
    // Generate recommendations whenever user or listings data changes
    performanceMonitor.measureFunction("generate_recommendations", () => {
      generateRecommendations();
    });
  }, [generateRecommendations, user, listings]); // Added 'user' and 'listings' to dependencies

  // Handle tab visibility changes to refresh listings
  useTabVisibility({
    onVisible: () => {
      // Tab became visible, refreshing listings
      if (!isLoading) {
        refreshListings().catch(console.error);
      }
    },
    onFocus: () => {
      // Window focused
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

  const contextValue = useMemo(
    () => ({
      listings,
      filteredListings,
      recommendedListings,
      filters,
      setFilters,
      addListing,
      updateListing,
      deleteListing,
      favoriteListings,
      toggleFavorite,
      isLoading,
      error,
      refreshListings,
      sortBy,
      setSortBy,
      universitySuggestions,
    }),
    [
      listings,
      filteredListings,
      recommendedListings,
      filters,
      addListing,
      updateListing,
      deleteListing,
      favoriteListings,
      toggleFavorite,
      isLoading,
      error,
      refreshListings,
      sortBy,
      universitySuggestions,
    ]
  );

  return (
    <ListingsContext.Provider value={contextValue}>
      {children}
    </ListingsContext.Provider>
  );
};
