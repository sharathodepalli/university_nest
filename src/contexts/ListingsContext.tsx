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
import { Listing, SearchFilters, User } from "../types";
import { mockListings } from "../data/mockData";
import MatchingService from "../lib/matching";
import { errorHandler } from "../lib/errorHandler";
import { performanceMonitor } from "../lib/performance";
import { updateListingsWithRealAddresses } from "../lib/realAddressIntegration";
import { calculateDistance } from "../utils/haversine";
import { universityData, getNearbyUniversities } from "../data/universities";

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

interface ListingsProviderProps {
  children: ReactNode;
}

export const ListingsProvider: React.FC<ListingsProviderProps> = ({
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
  const [sortBy, setSortBy] = useState("relevance");

  const universitySuggestions = useMemo(() => {
    const universities = new Set<string>();

    // Add universities from listings
    listings.forEach((listing) => {
      if (
        listing.location.nearbyUniversities &&
        listing.location.nearbyUniversities.length > 0
      ) {
        listing.location.nearbyUniversities.forEach((uni) =>
          universities.add(uni.name)
        );
      } else if (listing.host && listing.host.university) {
        // Fallback for listings without nearbyUniversities array but with a host university
        universities.add(listing.host.university);
      }
    });

    // Add user's university
    if (user?.university) {
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
    try {
      setIsLoading(true);
      setError(null);

      if (import.meta.env.DEV) {
        console.log(
          "[ListingsContext] Refreshing listings. Supabase ready:",
          isSupabaseReady
        );
      }

      if (!isSupabaseReady) {
        // Use mock data with verified real addresses for development
        console.log(
          "[ListingsContext] Using mock data. Available listings:",
          mockListings.length
        );
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate loading

        const listingsWithRealAddresses =
          updateListingsWithRealAddresses(mockListings);

        setListings(listingsWithRealAddresses);
        setIsLoading(false);
        return;
      }

      const startTime = performance.now();

      // Fetch listings and their host profiles from Supabase
      const { data, error: fetchError } = await supabase
        .from("listings")
        .select(
          `
          *,
          profiles:host_id (
            id,
            name,
            university,
            year,
            bio,
            phone,
            verified,
            profile_picture,
            preferences,
            location,
            matchingPreferences
          )
        `
        )
        .eq("status", "active")
        .order("created_at", { ascending: false });

      performanceMonitor.recordMetric(
        "listings_fetch_time",
        performance.now() - startTime
      );

      if (fetchError) {
        throw new Error(`Failed to fetch listings: ${fetchError.message}`);
      }

      const formattedListings = (data || [])
        .map((item): Listing | null => {
          try {
            const latitude = item.location?.latitude;
            const longitude = item.location?.longitude;

            let nearbyUniversities: { name: string; distance: number }[] = [];

            // Only calculate nearby universities if valid coordinates are present
            // This prevents calculating distances from (0,0) 'Null Island'
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
              console.warn(
                `[ListingsContext] Listing ${item.id} has invalid or zero coordinates. Skipping nearby universities calculation.`
              );
            }

            return {
              id: item.id,
              title: item.title || "Untitled Listing",
              description: item.description || "",
              price: typeof item.price === "number" ? item.price : 0,
              location: {
                address: item.location?.address || "Unknown Address",
                city: item.location?.city || "Unknown",
                state: item.location?.state || "Unknown",
                country: item.location?.country || "USA",
                latitude: typeof latitude === "number" ? latitude : 0, // Ensure numeric type for latitude
                longitude: typeof longitude === "number" ? longitude : 0, // Ensure numeric type for longitude
                nearbyUniversities: nearbyUniversities, // Assign the (potentially empty) calculated array
              },
              roomType: item.room_type || "single",
              amenities: Array.isArray(item.amenities) ? item.amenities : [],
              images: Array.isArray(item.images) ? item.images : [],
              availableFrom: item.available_from
                ? new Date(item.available_from)
                : new Date(),
              availableTo: item.available_to
                ? new Date(item.available_to)
                : undefined,
              maxOccupants:
                typeof item.max_occupants === "number" ? item.max_occupants : 1,
              hostId: item.host_id,
              host: {
                // Map fetched profile data to User type
                id: item.profiles?.id || item.host_id,
                name: item.profiles?.name || "Unknown Host",
                email: item.profiles?.email || "", // Email should be pulled from profiles table now
                university: item.profiles?.university || "Unknown University",
                year: item.profiles?.year || "Unknown",
                bio: item.profiles?.bio || "",
                phone: item.profiles?.phone || undefined,
                verified: Boolean(item.profiles?.verified),
                profilePicture: item.profiles?.profile_picture || undefined,
                preferences: item.profiles?.preferences || {},
                location: item.profiles?.location || {
                  // Use fetched location from profile or default
                  address: "",
                  city: "",
                  state: "",
                  country: "",
                  coordinates: { lat: 0, lng: 0 },
                },
                matchingPreferences: item.profiles?.matchingPreferences || {}, // Use fetched matchingPreferences or default
                createdAt: item.profiles?.created_at
                  ? new Date(item.profiles.created_at)
                  : new Date(),
              } as User, // Assert as User type
              createdAt: item.created_at
                ? new Date(item.created_at)
                : new Date(),
              updatedAt: item.updated_at
                ? new Date(item.updated_at)
                : new Date(),
              status: item.status || "active",
              preferences: item.preferences || {},
              rules: Array.isArray(item.rules) ? item.rules : [],
              deposit:
                typeof item.deposit === "number" ? item.deposit : undefined,
              utilities: item.utilities || {},
            };
          } catch (itemError) {
            errorHandler.logError(
              new Error(`Error formatting listing ${item.id}: ${itemError}`)
            );
            return null; // Return null for problematic listings
          }
        })
        .filter((listing): listing is Listing => listing !== null); // Filter out nulls

      if (import.meta.env.DEV) {
        console.log(
          "[ListingsContext] Formatted listings:",
          formattedListings.length
        );
      }
      setListings(formattedListings);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch listings";
      setError(errorMessage);
      errorHandler.logError(new Error(errorMessage));

      // Always fallback to mock data on error or in development
      console.log(
        "[ListingsContext] Error occurred, falling back to mock data. Error:",
        errorMessage
      );
      setListings(updateListingsWithRealAddresses(mockListings)); // Ensure mock data fallback is also processed
    } finally {
      setIsLoading(false);
    }
  }, [isSupabaseReady]);

  /**
   * Fetches favorite listings for the current user.
   */
  const fetchFavorites = useCallback(async () => {
    if (!user) return; // Only fetch if user is logged in

    try {
      if (!isSupabaseReady) {
        // Load favorites from localStorage for development
        const storedFavorites = localStorage.getItem("uninest_favorites");
        if (storedFavorites) {
          try {
            const parsed = JSON.parse(storedFavorites);
            setFavoriteListings(Array.isArray(parsed) ? parsed : []);
          } catch (error) {
            errorHandler.logError(
              new Error("[ListingsContext] Error parsing stored favorites")
            );
            setFavoriteListings([]);
          }
        }
        return;
      }

      // Fetch favorites from Supabase
      const { data, error } = await supabase
        .from("favorites")
        .select("listing_id")
        .eq("user_id", user.id);

      if (error) {
        throw new Error(`Failed to fetch favorites: ${error.message}`);
      }

      setFavoriteListings((data || []).map((fav: any) => fav.listing_id));
    } catch (error) {
      errorHandler.logError(
        new Error(`[ListingsContext] Error fetching favorites: ${error}`)
      );
      setFavoriteListings([]); // Clear favorites on error
    }
  }, [user, isSupabaseReady]);

  /**
   * Applies current filters and sorting preferences to the listings.
   */
  const applyFiltersAndSorting = useCallback(() => {
    try {
      let currentFilteredListings = [...listings];
      if (import.meta.env.DEV) {
        console.log(
          "[ListingsContext] Applying filters to",
          currentFilteredListings.length,
          "listings"
        );
      }

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
          typeof filters.university === "string"
            ? filters.university
            : filters.university.custom;

        if (universityToFilter) {
          const lowercasedUniversity = universityToFilter.toLowerCase();
          currentFilteredListings = currentFilteredListings.filter(
            (listing) => {
              const hostUniversityMatch =
                listing.host?.university?.toLowerCase() ===
                lowercasedUniversity;

              const nearbyUniversityMatch = (
                listing.location.nearbyUniversities || []
              ).some((uni) => uni.name.toLowerCase() === lowercasedUniversity);

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
          filters.amenities!.every((amenity) =>
            (listing.amenities || []).includes(amenity)
          )
        );
      }

      // Available From (Move-in Date) Filter
      if (filters.availableFrom instanceof Date) {
        // Ensure it's a Date object
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
    } catch (error) {
      errorHandler.logError(
        new Error(`[ListingsContext] Error applying filters: ${error}`)
      );
      setFilteredListings(listings); // Fallback to all listings on filter error
    }
  }, [listings, filters, sortBy, user]);

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
    } catch (error) {
      errorHandler.logError(
        new Error(
          `[ListingsContext] Error generating recommendations: ${error}`
        )
      );
      setRecommendedListings([]); // Clear recommendations on error
    }
  }, [user, listings]);

  /**
   * Adds a new listing to the database or mock data.
   */
  const addListing = useCallback(
    async (
      newListing: Omit<Listing, "id" | "createdAt" | "updatedAt" | "host">
    ) => {
      if (!user) throw new Error("User must be logged in to create a listing.");

      try {
        if (!isSupabaseReady) {
          console.log("[ListingsContext] Mock add listing for development.");
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
            available_from: newListing.availableFrom.toISOString(), // Store as ISO string
            available_to: newListing.availableTo?.toISOString() || null, // Store as ISO string or null
            max_occupants: newListing.maxOccupants,
            host_id: user.id, // Link to current user's ID
            status: newListing.status,
            preferences: newListing.preferences,
            rules: newListing.rules,
            deposit: newListing.deposit,
            utilities: newListing.utilities,
          })
          .select()
          .single(); // Get the inserted row

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
    async (id: string, updates: Partial<Listing>) => {
      try {
        if (!isSupabaseReady) {
          console.log("[ListingsContext] Mock update listing for development.");
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
          .eq("id", id); // Find by ID

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
    async (id: string) => {
      try {
        if (!isSupabaseReady) {
          console.log("[ListingsContext] Mock delete listing for development.");
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
      } catch (error) {
        errorHandler.logError(
          new Error(`[ListingsContext] Error toggling favorite: ${error}`)
        );
      }
    },
    [user, favoriteListings, isSupabaseReady]
  );

  // Effects for data loading and filtering
  useEffect(() => {
    refreshListings(); // Initial fetch
  }, [refreshListings]);

  useEffect(() => {
    if (user) {
      fetchFavorites(); // Fetch favorites when user changes
    } else {
      setFavoriteListings([]); // Clear favorites if user logs out
    }
  }, [user, fetchFavorites]);

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

  // Memoized context value to prevent unnecessary re-renders
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
