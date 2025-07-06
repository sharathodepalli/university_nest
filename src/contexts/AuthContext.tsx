import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { User } from "../types";
import GeocodingService from "../utils/geocoding";
import { Database } from "../types/database";

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseAuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  isLoading: boolean;
  isSupabaseReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseAuthUser | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseReady] = useState(isSupabaseConfigured());

  /**
   * Attempts to fetch user's current geolocation and update their profile in DB.
   * Logs warnings if geolocation is denied or not supported.
   */
  const fetchUserGeolocation = async (currentUserId: string) => {
    if (!navigator.geolocation) {
      console.warn("[AuthContext] Geolocation not supported by this browser.");
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          // Request geolocation with options for high accuracy and timeout
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000, // 5 seconds
            maximumAge: 0, // No cached position
          });
        }
      );

      const { latitude, longitude } = position.coords;
      console.log(
        `[AuthContext] Geolocation obtained: Lat ${latitude}, Lng ${longitude}`
      );

      // Reverse geocode to get human-readable address components
      const reverseGeocodeResult = await GeocodingService.reverseGeocode(
        latitude,
        longitude
      );
      let address = "";
      let city = "Unknown City";
      let state = "Unknown State";
      let country = "USA";

      if (
        reverseGeocodeResult.success &&
        reverseGeocodeResult.formattedAddress
      ) {
        address = reverseGeocodeResult.formattedAddress;
        const addressComponents = reverseGeocodeResult.formattedAddress
          .split(",")
          .map((s) => s.trim());
        // Attempt to parse common components from formatted address string
        // This heuristic might need refinement based on expected address formats
        if (addressComponents.length >= 3) {
          city = addressComponents[addressComponents.length - 3];
          state = addressComponents[addressComponents.length - 2].split(" ")[0];
          country = addressComponents[addressComponents.length - 1];
        } else if (addressComponents.length === 2) {
          city = addressComponents[0];
          state = addressComponents[1];
        }
      }

      // Update user's profile with location coordinates in the database if Supabase is configured
      if (isSupabaseReady) {
        // Cast to Partial<Database['public']['Tables']['profiles']['Update']> for type safety with DB update
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            location: {
              address: address,
              city,
              state,
              country,
              coordinates: { lat: latitude, lng: longitude },
            } as User["location"], // Assert to User['location'] type defined in types/index.ts
          })
          .eq("id", currentUserId);

        if (updateError) {
          console.error(
            "[AuthContext] Error updating user location in DB:",
            updateError
          );
        } else {
          console.log("[AuthContext] User location updated in DB.");
        }
      }

      // Update local user state
      setUser((prev) =>
        prev
          ? {
              ...prev,
              location: {
                address: address,
                city,
                state,
                country,
                coordinates: { lat: latitude, lng: longitude },
              },
            }
          : prev
      );
    } catch (error: any) {
      if (error.code === error.PERMISSION_DENIED) {
        console.warn("[AuthContext] Geolocation permission denied by user.");
      } else {
        console.error("[AuthContext] Error fetching geolocation:", error);
      }
    }
  };

  /**
   * Initializes authentication state from Supabase session or localStorage.
   * Attempts to fetch user profile and geolocation.
   */
  useEffect(() => {
    let mounted = true; // Flag to prevent state updates on unmounted component

    const initializeAuth = async () => {
      if (!isSupabaseReady) {
        // Development Mode: Load user from localStorage
        const storedUser = localStorage.getItem("uninest_user");
        if (storedUser && mounted) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            // In mock mode, attempt to set a default user location if not present
            if (!parsedUser.location?.coordinates && parsedUser.id) {
              await fetchUserGeolocation(parsedUser.id);
            }
          } catch (error) {
            console.error("[AuthContext] Error parsing stored user:", error);
            localStorage.removeItem("uninest_user"); // Clear corrupted data
          }
        }
        if (mounted) setIsLoading(false);
        return;
      }

      // Production/Real-Time Mode: Fetch session from Supabase
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("[AuthContext] Error getting Supabase session:", error);
          if (mounted) setIsLoading(false);
          return;
        }

        if (mounted) {
          setSupabaseUser(session?.user ?? null);
          if (session?.user) {
            await fetchUserProfile(session.user.id);
            await fetchUserGeolocation(session.user.id); // Get geolocation after profile is loaded
          } else {
            setIsLoading(false); // No user session
          }
        }
      } catch (error) {
        console.error("[AuthContext] Error initializing auth process:", error);
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to Supabase auth state changes for real-time updates
    let subscription: { data: { subscription: any } } | null = null;
    if (isSupabaseReady) {
      subscription = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(
          `[AuthContext] Auth state changed: ${event}`,
          session?.user?.email
        );

        if (!mounted) return; // Prevent state update if component unmounted

        setSupabaseUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserProfile(session.user.id);
          await fetchUserGeolocation(session.user.id); // Re-fetch geolocation on auth change
        } else {
          setUser(null); // Clear user state on logout
          setIsLoading(false);
        }
      });
    }

    // Cleanup: Unsubscribe from auth changes on component unmount
    return () => {
      mounted = false; // Mark as unmounted
      if (subscription?.data?.subscription) {
        subscription.data.subscription.unsubscribe();
      }
    };
  }, [isSupabaseReady]); // Dependency: re-run if Supabase readiness changes

  /**
   * Fetches the user's profile from the 'profiles' table.
   * Creates a basic profile if not found.
   */
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log(`[AuthContext] Fetching profile for user: ${userId}`);

      // Explicitly type the expected data row from the profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single<Database["public"]["Tables"]["profiles"]["Row"]>(); // Correctly type the data here

      if (error) {
        console.error("[AuthContext] Error fetching profile:", error);

        if (error.code === "PGRST116") {
          // Supabase "Row not found" error code
          console.log(
            "[AuthContext] Profile not found, creating basic user from auth data"
          );
          const basicUser: User = {
            id: userId,
            name:
              supabaseUser?.user_metadata?.name ||
              supabaseUser?.email?.split("@")[0] ||
              "User",
            email: supabaseUser?.email || "",
            university:
              supabaseUser?.user_metadata?.university ||
              "University of California, Berkeley",
            year: supabaseUser?.user_metadata?.year || "Junior",
            bio: "",
            verified: false,
            createdAt: new Date(),
            preferences: {
              smokingAllowed: false,
              petsAllowed: true,
              studyFriendly: true,
              socialLevel: "moderate",
              maxBudget: 1500,
              preferredRoomTypes: ["single"],
              preferredAmenities: ["Wi-Fi", "Laundry"],
            },
            location: {
              // Provide default location with empty address
              address: "",
              city: "Berkeley",
              state: "California",
              country: "USA",
              coordinates: {
                lat: 37.8719,
                lng: -122.2585,
              },
            },
            matchingPreferences: {
              maxDistance: 25,
              sameUniversity: true,
              similarYear: false,
              budgetRange: {
                min: 800,
                max: 1500,
              },
            },
          };
          setUser(basicUser);
          setIsLoading(false);
          return; // Exit function after creating basic user
        }

        setIsLoading(false); // Set loading to false on other errors
        return; // Exit function on error
      }

      if (data) {
        console.log("[AuthContext] Profile found:", data);

        // Map database row data to frontend User type
        const userProfile: User = {
          id: data.id,
          name: data.name,
          email: supabaseUser?.email || "", // Use Supabase auth email as primary
          university: data.university,
          year: data.year,
          bio: data.bio || "",
          phone: data.phone || undefined, // Convert null to undefined if schema allows optional
          verified: Boolean(data.verified), // Ensure boolean type
          profilePicture: data.profile_picture || undefined, // Convert null to undefined
          preferences: data.preferences || {
            // Provide default if null
            smokingAllowed: false,
            petsAllowed: true,
            studyFriendly: true,
            socialLevel: "moderate",
            maxBudget: 1500,
            preferredRoomTypes: ["single"],
            preferredAmenities: ["Wi-Fi", "Laundry"],
          },
          location: data.location || {
            // Provide default if null
            address: "",
            city: "Berkeley",
            state: "California",
            country: "USA",
            coordinates: { lat: 37.8719, lng: -122.2585 },
          },
          matchingPreferences: data.matchingPreferences || {
            // Provide default if null
            maxDistance: 25,
            sameUniversity: true,
            similarYear: false,
            budgetRange: { min: 800, max: data.preferences?.maxBudget || 1500 },
          },
          createdAt: new Date(data.created_at),
        };

        console.log("[AuthContext] Setting user profile:", userProfile);
        setUser(userProfile);
      }
    } catch (error) {
      // Corrected try-catch block structure
      console.error("[AuthContext] Error in fetchUserProfile:", error);
    } finally {
      console.log(
        "[AuthContext] Profile fetch completed, setting loading to false"
      );
      setIsLoading(false);
    }
  };

  /**
   * Handles user login with email and password.
   * Falls back to mock authentication if Supabase fails or is not ready.
   */
  const login = async (email: string, password: string) => {
    if (!isSupabaseReady) {
      console.log("[AuthContext] Mock login for development.");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
      const mockUser: User = {
        id: "mock-user-1", // Unique ID for mock user
        name: "Mock Alex Johnson",
        email: email,
        university: "University of California, Berkeley",
        year: "Junior",
        bio: "Mock profile: Computer Science student looking for a quiet place to study.",
        verified: true,
        createdAt: new Date(),
        preferences: {
          smokingAllowed: false,
          petsAllowed: true,
          studyFriendly: true,
          socialLevel: "moderate",
          maxBudget: 1500,
          preferredRoomTypes: ["single", "studio"],
          preferredAmenities: ["Wi-Fi", "Laundry", "Kitchen"],
        },
        location: {
          address: "123 Mock St, Berkeley",
          city: "Berkeley",
          state: "California",
          country: "USA",
          coordinates: { lat: 37.8719, lng: -122.2585 }, // Default mock coordinates
        },
        matchingPreferences: {
          maxDistance: 25,
          sameUniversity: true,
          similarYear: false,
          budgetRange: { min: 800, max: 1500 },
        },
      };
      setUser(mockUser);
      localStorage.setItem("uninest_user", JSON.stringify(mockUser));
      await fetchUserGeolocation(mockUser.id); // Attempt geolocation even for mock users
      return;
    }

    try {
      setIsLoading(true);
      console.log(`[AuthContext] Attempting login for: ${email}`);

      // Attempt Supabase login with a timeout
      const loginPromise = supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      const timeoutPromise = new Promise<never>(
        (
          _,
          reject // Type as never
        ) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "Login timed out. Falling back to mock authentication."
                )
              ),
            10000 // 10 seconds timeout
          )
      );

      const { data, error } = (await Promise.race([
        loginPromise,
        timeoutPromise,
      ])) as { data: any; error: any }; // Explicitly cast to prevent type issues from Promise.race

      if (error) {
        console.error("[AuthContext] Supabase login error:", error);
        throw error; // Re-throw to trigger catch block for mock fallback
      }
      console.log(`[AuthContext] Login successful for: ${data.user?.email}`);
      // Auth state change handler will automatically fetch profile and geolocation
    } catch (error: any) {
      console.error(
        "[AuthContext] Login process failed. Falling back to mock authentication.",
        error
      );
      // Always fallback to mock login on any error during the real login process
      const mockUser: User = {
        id: "mock-user-fallback", // Different ID for fallback mock user
        name: "Mock Fallback User",
        email: email, // Use attempted email
        university: "University of California, Berkeley",
        year: "Junior",
        bio: "Mock profile: Login failed, using fallback mock data.",
        verified: false,
        createdAt: new Date(),
        preferences: {
          smokingAllowed: false,
          petsAllowed: true,
          studyFriendly: true,
          socialLevel: "moderate",
          maxBudget: 1500,
          preferredRoomTypes: ["single"],
          preferredAmenities: ["Wi-Fi", "Laundry", "Kitchen"],
        },
        location: {
          address: "456 Fallback Ave, San Francisco",
          city: "San Francisco",
          state: "California",
          country: "USA",
          coordinates: { lat: 37.7749, lng: -122.4194 }, // Default fallback coordinates
        },
        matchingPreferences: {
          maxDistance: 25,
          sameUniversity: true,
          similarYear: false,
          budgetRange: { min: 800, max: 1500 },
        },
      };
      setUser(mockUser);
      localStorage.setItem("uninest_user", JSON.stringify(mockUser));
      await fetchUserGeolocation(mockUser.id);
      setIsLoading(false);
    }
  };

  /**
   * Handles user registration.
   * Falls back to mock registration if Supabase is not ready.
   */
  const register = async (userData: Partial<User> & { password: string }) => {
    if (!isSupabaseReady) {
      console.log("[AuthContext] Mock registration for development.");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newUser: User = {
        id: `mock-user-${Date.now()}`, // Unique ID for mock user
        name: userData.name || "",
        email: userData.email || "",
        university: userData.university || "",
        year: userData.year || "",
        bio: userData.bio || "",
        verified: false,
        createdAt: new Date(),
        preferences: {
          smokingAllowed: false,
          petsAllowed: true,
          studyFriendly: true,
          socialLevel: "moderate",
          maxBudget: 1500,
          preferredRoomTypes: ["single"],
          preferredAmenities: ["Wi-Fi", "Laundry"],
        },
        location: {
          address: "", // Default empty address
          city: "Berkeley",
          state: "California",
          country: "USA",
          coordinates: { lat: 37.8719, lng: -122.2585 },
        },
        matchingPreferences: {
          maxDistance: 25,
          sameUniversity: true,
          similarYear: false,
          budgetRange: { min: 500, max: 2000 },
        },
      };
      setUser(newUser);
      localStorage.setItem("uninest_user", JSON.stringify(newUser));
      await fetchUserGeolocation(newUser.id); // Attempt geolocation for new mock users
      return;
    }

    try {
      setIsLoading(true);
      console.log(
        `[AuthContext] Attempting registration for: ${userData.email}`
      );

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email!.trim(),
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            university: userData.university,
            year: userData.year,
          },
        },
      });

      if (authError) {
        console.error("[AuthContext] Supabase registration error:", authError);
        throw authError;
      }

      if (authData.user) {
        console.log("[AuthContext] User created, creating profile...");
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          name: userData.name!,
          university: userData.university!,
          year: userData.year!,
          bio: userData.bio || "",
          phone: userData.phone || null, // Ensure null for optional DB columns
          verified: false,
          preferences: userData.preferences || {}, // Default empty object if not provided
        });
        if (profileError) {
          console.error("[AuthContext] Profile creation error:", profileError);
          throw profileError;
        }
        console.log(
          "[AuthContext] Registration and profile creation successful"
        );
        // Auth state change handler will pick up the new session and fetch profile/geolocation
      }
    } catch (error: any) {
      console.error("[AuthContext] Registration process failed:", error);
      setIsLoading(false);
      throw new Error(error.message || "Registration failed");
    }
  };

  /**
   * Handles user logout.
   */
  const logout = async () => {
    if (!isSupabaseReady) {
      console.log("[AuthContext] Mock logout.");
      setUser(null);
      localStorage.removeItem("uninest_user");
      return;
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[AuthContext] Supabase logout error:", error);
        throw error;
      }
      console.log("[AuthContext] Logout successful.");
    } catch (error) {
      console.error("[AuthContext] Logout process failed:", error);
    }
  };

  /**
   * Updates the user's profile in the database.
   */
  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error("No user logged in to update profile.");
    if (!isSupabaseReady) {
      console.log("[AuthContext] Mock profile update.");
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem("uninest_user", JSON.stringify(updatedUser));
      return;
    }
    try {
      // Cast updates to match the DB table's update type for safety
      const profileUpdates: Database["public"]["Tables"]["profiles"]["Update"] =
        {
          name: updates.name,
          university: updates.university,
          year: updates.year,
          bio: updates.bio,
          phone: updates.phone,
          profile_picture: updates.profilePicture,
          preferences: updates.preferences,
          location: updates.location, // location is jsonb, directly assignable
          matchingPreferences: updates.matchingPreferences, // matchingPreferences is jsonb
        };

      const { error } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", user.id);

      if (error) {
        console.error("[AuthContext] Profile update error:", error);
        throw error;
      }
      // Update local user state
      setUser((prev) => (prev ? { ...prev, ...updates } : null));
      console.log("[AuthContext] Profile updated successfully.");
    } catch (error: any) {
      console.error("[AuthContext] Profile update process failed:", error);
      throw new Error(error.message || "Profile update failed");
    }
  };

  const value: AuthContextType = {
    user,
    supabaseUser,
    login,
    register,
    logout,
    updateProfile,
    isLoading,
    isSupabaseReady,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
