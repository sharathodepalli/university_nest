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
import { Listing, SearchFilters, User } from "../types"; // Make sure SearchFilters is imported
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

  // Memoized refresh function to prevent unnecessary re-renders
  const refreshListings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("Refreshing listings. Supabase ready:", isSupabaseReady);

      if (!isSupabaseReady) {
        // Use mock data with verified real addresses for development
        console.log(
          "Using mock data. Available listings:",
          mockListings.length
        );
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate loading

        // Use the real address integration to get listings with verified addresses and accurate distances
        const listingsWithRealAddresses =
          updateListingsWithRealAddresses(mockListings);

        setListings(listingsWithRealAddresses);
        setIsLoading(false);
        return;
      }

      const startTime = performance.now();

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
            preferences
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
            const latitude = item.location?.latitude || 0;
            const longitude = item.location?.longitude || 0;

            const nearbyUniversities = getNearbyUniversities(
              { lat: latitude, lng: longitude },
              50 // 50 miles radius
            );

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
                latitude: latitude,
                longitude: longitude,
                nearbyUniversities: nearbyUniversities,
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
                id: item.profiles?.id || item.host_id,
                name: item.profiles?.name || "Unknown Host",
                email: "", // Email not exposed for privacy
                university: item.profiles?.university || "Unknown University",
                year: item.profiles?.year || "Unknown",
                bio: item.profiles?.bio || "",
                phone: item.profiles?.phone,
                verified: Boolean(item.profiles?.verified),
                profilePicture: item.profiles?.profile_picture,
                preferences: item.profiles?.preferences || {},
                createdAt: new Date(),
              } as User,
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
            return null;
          }
        })
        .filter((listing): listing is Listing => listing !== null);

      console.log("Formatted listings:", formattedListings.length);
      setListings(formattedListings);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch listings";
      setError(errorMessage);
      errorHandler.logError(new Error(errorMessage));

      // Always fallback to mock data on error or in development
      console.log(
        "Error occurred, falling back to mock data. Error:",
        errorMessage
      );
      setListings(mockListings);
    } finally {
      setIsLoading(false);
    }
  }, [isSupabaseReady]);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;

    try {
      if (!isSupabaseReady) {
        // Load favorites from localStorage for development
        const storedFavorites = localStorage.getItem("uninest_favorites");
        if (storedFavorites) {
          try {
            const parsed = JSON.parse(storedFavorites);
            setFavoriteListings(Array.isArray(parsed) ? parsed : []);
          } catch (error) {
            errorHandler.logError(new Error("Error parsing stored favorites"));
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
    } catch (error) {
      errorHandler.logError(new Error(`Error fetching favorites: ${error}`));
      setFavoriteListings([]);
    }
  }, [user, isSupabaseReady]);

  // Memoized filtering and sorting logic
  const applyFiltersAndSorting = useCallback(() => {
    try {
      let filtered = [...listings];
      console.log("Applying filters to", filtered.length, "listings");

      // Apply search filters first
      if (filters.location) {
        const searchTerm = filters.location.toLowerCase();
        filtered = filtered.filter((listing) => {
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
          filtered = filtered.filter((listing) => {
            // Check the host's university
            const hostUniversityMatch =
              listing.host?.university?.toLowerCase() === lowercasedUniversity;

            // Check nearby universities, which is the more reliable source
            const nearbyUniversityMatch =
              listing.location.nearbyUniversities?.some(
                (uni) => uni.name.toLowerCase() === lowercasedUniversity
              ) || false;

            return hostUniversityMatch || nearbyUniversityMatch;
          });
        }
      }

      // Fix for maxDistance: Safely check for user.location and coordinates
      if (
        filters.maxDistance !== undefined &&
        user?.location?.coordinates?.lat !== undefined &&
        user?.location?.coordinates?.lng !== undefined
      ) {
        // user.location.coordinates is now guaranteed to have lat and lng
        const userCoordinates = user.location.coordinates;

        filtered = filtered.filter((listing) => {
          if (!listing.location?.latitude || !listing.location?.longitude)
            return false;

          const distance = calculateDistance(
            userCoordinates.lat,
            userCoordinates.lng,
            listing.location.latitude,
            listing.location.longitude
          );
          return distance <= filters.maxDistance!;
        });
      }

      if (filters.priceRange) {
        filtered = filtered.filter((listing) => {
          const price = listing.price || 0;
          const minPrice = filters.priceRange?.min ?? 0; // Use nullish coalescing for default
          const maxPrice = filters.priceRange?.max ?? Infinity; // Use nullish coalescing for default
          return price >= minPrice && price <= maxPrice;
        });
      }

      if (filters.roomType && filters.roomType.length > 0) {
        filtered = filtered.filter((listing) =>
          filters.roomType!.includes(listing.roomType)
        );
      }

      if (filters.amenities && filters.amenities.length > 0) {
        filtered = filtered.filter((listing) =>
          filters.amenities!.every((amenity) =>
            (listing.amenities || []).includes(amenity)
          )
        );
      }

      // Fix for availableFrom: Compare Date objects
      if (filters.availableFrom instanceof Date) {
        // Ensure it's a Date object
        filtered = filtered.filter(
          (listing) =>
            listing.availableFrom &&
            listing.availableFrom.getTime() >= filters.availableFrom!.getTime() // Compare Date objects
        );
      }

      // Handle moveInDate filter
      // Now using 'filters.moveInDate' directly as it should be defined in types/index.ts
      if (filters.moveInDate) {
        const filterDate = new Date(filters.moveInDate);
        filtered = filtered.filter(
          (listing) =>
            listing.availableFrom &&
            listing.availableFrom.getTime() <= filterDate.getTime()
        );
      }

      // Apply user-based filtering if user is logged in
      if (user) {
        // Don't show user's own listings
        filtered = filtered.filter((listing) => listing.hostId !== user.id);

        // Apply sorting with user context
        filtered = MatchingService.sortListings(filtered, sortBy, user);
      } else {
        // Default sorting for non-logged-in users
        switch (sortBy) {
          case "price-asc": // Changed from "price"
            filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
          case "price-desc": // Added for price high to low
            filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
          case "newest":
            filtered.sort((a, b) => {
              const timeA = a.createdAt ? a.createdAt.getTime() : 0;
              const timeB = b.createdAt ? b.createdAt.getTime() : 0;
              return timeB - timeA;
            });
            break;
          default:
            // Keep current order
            break;
        }
      }

      console.log("Filtered listings:", filtered.length);
      setFilteredListings(filtered);
    } catch (error) {
      errorHandler.logError(new Error(`Error applying filters: ${error}`));
      setFilteredListings(listings);
    }
  }, [listings, filters, sortBy, user]);

  const generateRecommendations = useCallback(() => {
    if (!user || listings.length === 0) {
      console.log("No user or listings for recommendations");
      return;
    }

    try {
      console.log("Generating recommendations for user:", user.university);
      // Ensure relevance and match scores are calculated if they don't exist
      const listingsWithScores = listings.map((listing) => ({
        ...listing,
        matchScore: MatchingService.calculateMatchScore(user, listing),
        relevanceScore: MatchingService.calculateRelevanceScore(user, listing),
      }));

      const recommendations = MatchingService.getRecommendations(
        user,
        listingsWithScores, // Pass listings with scores
        6
      );
      console.log("Generated recommendations:", recommendations.length);
      setRecommendedListings(recommendations);
    } catch (error) {
      errorHandler.logError(
        new Error(`Error generating recommendations: ${error}`)
      );
      setRecommendedListings([]);
    }
  }, [user, listings]);

  const addListing = useCallback(
    async (
      newListing: Omit<Listing, "id" | "createdAt" | "updatedAt" | "host">
    ) => {
      if (!user) throw new Error("User must be logged in");

      try {
        if (!isSupabaseReady) {
          // Mock add for development
          const listing: Listing = {
            ...newListing,
            id: Date.now().toString(),
            host: user,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setListings((prev) => [listing, ...prev]);
          return;
        }

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
            available_from: newListing.availableFrom
              .toISOString()
              .split("T")[0],
            available_to: newListing.availableTo?.toISOString().split("T")[0],
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

        await refreshListings();
      } catch (error: any) {
        const errorMessage = error.message || "Failed to create listing";
        errorHandler.logError(new Error(errorMessage));
        throw new Error(errorMessage);
      }
    },
    [user, isSupabaseReady, refreshListings]
  );

  const updateListing = useCallback(
    async (id: string, updates: Partial<Listing>) => {
      try {
        if (!isSupabaseReady) {
          // Mock update for development
          setListings((prev) =>
            prev.map((listing) =>
              listing.id === id
                ? { ...listing, ...updates, updatedAt: new Date() }
                : listing
            )
          );
          return;
        }

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
            available_from: updates.availableFrom?.toISOString().split("T")[0],
            available_to: updates.availableTo?.toISOString().split("T")[0],
            max_occupants: updates.maxOccupants,
            status: updates.status,
            preferences: updates.preferences,
            rules: updates.rules,
            deposit: updates.deposit,
            utilities: updates.utilities,
          })
          .eq("id", id);

        if (error) throw error;

        await refreshListings();
      } catch (error: any) {
        const errorMessage = error.message || "Failed to update listing";
        errorHandler.logError(new Error(errorMessage));
        throw new Error(errorMessage);
      }
    },
    [isSupabaseReady, refreshListings]
  );

  const deleteListing = useCallback(
    async (id: string) => {
      try {
        if (!isSupabaseReady) {
          // Mock delete for development
          setListings((prev) => prev.filter((listing) => listing.id !== id));
          return;
        }

        const { error } = await supabase.from("listings").delete().eq("id", id);

        if (error) throw error;

        await refreshListings();
      } catch (error: any) {
        const errorMessage = error.message || "Failed to delete listing";
        errorHandler.logError(new Error(errorMessage));
        throw new Error(errorMessage);
      }
    },
    [isSupabaseReady, refreshListings]
  );

  const toggleFavorite = useCallback(
    async (listingId: string) => {
      if (!user) return;

      const isFavorite = favoriteListings.includes(listingId);

      try {
        if (!isSupabaseReady) {
          // Mock toggle for development
          const updated = isFavorite
            ? favoriteListings.filter((id) => id !== listingId)
            : [...favoriteListings, listingId];

          setFavoriteListings(updated);
          localStorage.setItem("uninest_favorites", JSON.stringify(updated));
          return;
        }

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
        errorHandler.logError(new Error(`Error toggling favorite: ${error}`));
      }
    },
    [user, favoriteListings, isSupabaseReady]
  );

  // Effects
  useEffect(() => {
    refreshListings();
  }, [refreshListings]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user, fetchFavorites]);

  useEffect(() => {
    // Only apply filters when we actually have listings loaded
    // and when filters or sort order change
    if (listings.length > 0 || !isLoading) {
      performanceMonitor.measureFunction("apply_filters_and_sorting", () => {
        applyFiltersAndSorting();
      });
    }
  }, [applyFiltersAndSorting, listings.length, isLoading, filters, sortBy]); // Added filters and sortBy to dependencies

  useEffect(() => {
    performanceMonitor.measureFunction("generate_recommendations", () => {
      generateRecommendations();
    });
  }, [generateRecommendations, listings]); // Added listings to dependencies for recommendations

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
