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
import { Database } from "../types/database";

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseAuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  isSupabaseReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const LOCAL_STORAGE_VERSION = 1;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseAuthUser | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseReady] = useState(isSupabaseConfigured());

  const fetchUserGeolocation = async (currentUserId: string) => {
    if (!navigator.geolocation) {
      console.warn("[AuthContext] Geolocation not supported by this browser.");
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          });
        }
      );

      const { latitude, longitude } = position.coords;
      console.log(
        `[AuthContext] Geolocation obtained: Lat ${latitude}, Lng ${longitude}`
      );

      const { default: GeocodingService } = await import("../utils/geocoding");

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
        if (addressComponents.length >= 3) {
          city = addressComponents[addressComponents.length - 3];
          state = addressComponents[addressComponents.length - 2].split(" ")[0];
          country = addressComponents[addressComponents.length - 1];
        } else if (addressComponents.length === 2) {
          city = addressComponents[0];
          state = addressComponents[1];
        }
      }

      if (isSupabaseReady) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            location: {
              address: address,
              city,
              state,
              country,
              coordinates: { lat: latitude, lng: longitude },
            } as User["location"],
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
    } catch (error: any) {
      if (error.code === error.PERMISSION_DENIED) {
        console.warn("[AuthContext] Geolocation permission denied by user.");
      } else {
        console.error("[AuthContext] Error fetching geolocation:", error);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      setIsLoading(true);

      if (!isSupabaseReady) {
        if (process.env.NODE_ENV === "development") {
          console.log(
            "[AuthContext] Running in DEVELOPMENT mode: Loading mock user from localStorage."
          );
          const storedData = localStorage.getItem("uninest_user_data");
          if (storedData && mounted) {
            try {
              const parsedData = JSON.parse(storedData);
              if (parsedData.version === LOCAL_STORAGE_VERSION) {
                setUser(parsedData.user);
                if (
                  !parsedData.user.location?.coordinates &&
                  parsedData.user.id
                ) {
                  await fetchUserGeolocation(parsedData.user.id);
                }
              } else {
                console.warn(
                  "[AuthContext] localStorage version mismatch in DEV. Clearing cached user data."
                );
                localStorage.removeItem("uninest_user_data");
                setUser(null);
              }
            } catch (error) {
              console.error(
                "[AuthContext] Error parsing stored user data in DEV:",
                error
              );
              localStorage.removeItem("uninest_user_data");
              setUser(null);
            }
          }
        } else {
          console.error(
            "[AuthContext] ERROR: Supabase is NOT configured in PRODUCTION mode. Authentication will not work."
          );
          setUser(null);
        }
        setIsLoading(false);
        return;
      }

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("[AuthContext] Error getting Supabase session:", error);
          if (mounted) setUser(null);
          return;
        }

        if (mounted) {
          setSupabaseUser(session?.user ?? null);
          if (session?.user) {
            await fetchUserProfile(session.user.id); // fetchUserProfile will now manage geolocation side-effect
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error(
          "[AuthContext] Error during Supabase session initialization:",
          error
        );
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    let subscription: { data: { subscription: any } } | null = null;
    if (isSupabaseReady) {
      subscription = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(
          `[AuthContext] Auth state changed: ${event}`,
          session?.user?.email
        );
        setIsLoading(true);

        if (!mounted) return;

        setSupabaseUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserProfile(session.user.id); // fetchUserProfile will manage geolocation side-effect
        } else {
          setUser(null);
          setIsLoading(false);
        }
      });
    }

    return () => {
      mounted = false;
      if (subscription?.data?.subscription) {
        subscription.data.subscription.unsubscribe();
      }
    };
  }, [isSupabaseReady]);

  /**
   * Fetches the user's profile from the 'profiles' table.
   * This is the authoritative source for the 'user' state.
   * It also triggers a background geolocation update if needed, and waits for it on initial load/signup.
   */
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log(`[AuthContext] Fetching profile for user: ${userId}`);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single<Database["public"]["Tables"]["profiles"]["Row"]>();

      if (error) {
        console.error("[AuthContext] Error fetching profile:", error);

        if (error.code === "PGRST116") {
          console.log(
            "[AuthContext] Profile not found in DB. Creating basic user on frontend from auth metadata."
          );
          const basicUser: User = {
            id: userId,
            name:
              supabaseUser?.user_metadata?.name ||
              supabaseUser?.email?.split("@")[0] ||
              "User",
            email: supabaseUser?.email || "",
            university:
              supabaseUser?.user_metadata?.university || "Unknown University",
            year: supabaseUser?.user_metadata?.year || "Unknown",
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
              address: "",
              city: "Unknown City",
              state: "Unknown State",
              country: "USA",
              coordinates: {
                lat: 0,
                lng: 0,
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
          return;
        }

        setUser(null);
        return;
      }

      if (data) {
        console.log("[AuthContext] Profile found:", data);

        // Security check: Only consider user verified if they have a valid student_email
        // and the verification fields are consistent
        const isActuallyVerified = Boolean(
          data.student_verified &&
            data.student_email &&
            data.verification_status === "verified"
        );

        const userProfile: User = {
          id: data.id,
          name: data.name,
          email: supabaseUser?.email || "",
          university: data.university,
          year: data.year,
          bio: data.bio || "",
          phone: data.phone || undefined,
          verified: isActuallyVerified, // Only true if properly verified
          student_verified: isActuallyVerified, // Only true if properly verified
          student_email: data.student_email || undefined,
          verification_status: isActuallyVerified ? "verified" : "unverified",
          verification_method: isActuallyVerified
            ? data.verification_method || undefined
            : undefined,
          verified_at:
            isActuallyVerified && data.verified_at
              ? new Date(data.verified_at)
              : undefined,
          profilePicture: data.profile_picture || undefined,
          preferences: data.preferences || {
            smokingAllowed: false,
            petsAllowed: true,
            studyFriendly: true,
            socialLevel: "moderate",
            maxBudget: 1500,
            preferredRoomTypes: ["single"],
            preferredAmenities: ["Wi-Fi", "Laundry"],
          },
          location: data.location || {
            address: "",
            city: "Unknown City",
            state: "Unknown State",
            country: "USA",
            coordinates: { lat: 0, lng: 0 },
          },
          matchingPreferences: data.matchingPreferences || {
            maxDistance: 25,
            sameUniversity: true,
            similarYear: false,
            budgetRange: { min: 800, max: data.preferences?.maxBudget || 1500 },
          },
          createdAt: new Date(data.created_at),
        };

        console.log("[AuthContext] Setting user profile:", userProfile);
        setUser(userProfile);

        // Trigger background geolocation update AFTER setting user profile.
        // This ensures the profile appears faster, and geolocation updates in background.
        // The user can then save profile to make it permanent.
        const currentUserLocation = userProfile?.location?.coordinates;
        if (
          !currentUserLocation ||
          (currentUserLocation.lat === 0 && currentUserLocation.lng === 0)
        ) {
          fetchUserGeolocation(userId).catch((err) =>
            console.error("Background geolocation update failed:", err)
          );
        }
      }
    } catch (error) {
      console.error("[AuthContext] Error in fetchUserProfile:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles user login with email and password.
   * In production, logs user in via Supabase. In dev, uses mock data.
   * If real login fails, it does NOT fall back to mock user in production.
   */
  const login = async (email: string, password: string) => {
    setIsLoading(true);

    if (!isSupabaseReady) {
      if (process.env.NODE_ENV === "development") {
        console.log("[AuthContext] Mock login for development.");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const mockUser: User = {
          id: "mock-user-1",
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
            preferredRoomTypes: ["single"],
            preferredAmenities: ["Wi-Fi", "Laundry"],
          },
          location: {
            address: "123 Mock St, Berkeley",
            city: "Berkeley",
            state: "California",
            country: "USA",
            coordinates: { lat: 37.8719, lng: -122.2585 },
          },
          matchingPreferences: {
            maxDistance: 25,
            sameUniversity: true,
            similarYear: false,
            budgetRange: { min: 800, max: 1500 },
          },
        };
        setUser(mockUser);
        localStorage.setItem(
          "uninest_user_data",
          JSON.stringify({ version: LOCAL_STORAGE_VERSION, user: mockUser })
        );
        await fetchUserGeolocation(mockUser.id);
        setIsLoading(false);
        return;
      } else {
        const errorMsg = "Supabase is not configured. Login is unavailable.";
        console.error(`[AuthContext] ERROR: ${errorMsg}`);
        setIsLoading(false);
        throw new Error(errorMsg);
      }
    }

    try {
      console.log(`[AuthContext] Attempting real login for: ${email}`);

      const { error } = await supabase.auth.signInWithPassword({
        // FIX: Removed 'data' destructuring
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error("[AuthContext] Supabase login error:", error);
        throw error;
      }

      console.log(
        `[AuthContext] Login initiated successfully. Waiting for onAuthStateChange.`
      );
    } catch (error: any) {
      console.error("[AuthContext] Real login failed:", error);
      setUser(null);
      setIsLoading(false);
      throw new Error(
        error.message || "Login failed. Please check your credentials."
      );
    }
  };

  /**
   * Handles user registration.
   * In production, registers user via Supabase. In dev, uses mock data.
   * If real registration fails, it does NOT fall back to mock user in production.
   */
  const register = async (userData: Partial<User> & { password: string }) => {
    setIsLoading(true);

    if (!isSupabaseReady) {
      if (process.env.NODE_ENV === "development") {
        console.log("[AuthContext] Mock registration for development.");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const newUser: User = {
          id: `mock-user-${Date.now()}`,
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
            address: "",
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
        localStorage.setItem(
          "uninest_user_data",
          JSON.stringify({ version: LOCAL_STORAGE_VERSION, user: newUser })
        );
        await fetchUserGeolocation(newUser.id);
        setIsLoading(false);
        return;
      } else {
        const errorMsg =
          "Supabase is not configured. Registration is unavailable.";
        console.error(`[AuthContext] ERROR: ${errorMsg}`);
        setIsLoading(false);
        throw new Error(errorMsg);
      }
    }

    try {
      console.log(
        `[AuthContext] Attempting real registration for: ${userData.email}`
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
        console.log(
          "[AuthContext] User created in Auth. Creating profile in 'profiles' table..."
        );
        const profileInsertPayload: Database["public"]["Tables"]["profiles"]["Insert"] =
          {
            id: authData.user.id,
            name: userData.name!,
            university: userData.university!,
            year: userData.year!,
            email: userData.email!,
            bio: userData.bio || "",
            phone: userData.phone || null,
            verified: false,
            profile_picture: null,
            preferences: userData.preferences || {},
            location: {}, // Default empty object for jsonb
            matchingPreferences: {}, // Default empty object for jsonb
          };
        console.log(
          "[AuthContext] Profile Insert Payload:",
          profileInsertPayload
        );

        const { error: profileError } = await supabase
          .from("profiles")
          .insert(profileInsertPayload);

        if (profileError) {
          console.error(
            "[AuthContext] Profile creation error for 'profiles' table:",
            profileError
          );
          throw profileError;
        }
        console.log(
          "[AuthContext] Profile in 'profiles' table created successfully. Waiting for onAuthStateChange."
        );
      }
    } catch (error: any) {
      console.error("[AuthContext] Real registration failed:", error);
      setUser(null);
      setIsLoading(false);
      throw new Error(
        error.message || "Registration failed. Please try again."
      );
    }
  };

  const logout = async () => {
    setIsLoading(true);

    if (!isSupabaseReady) {
      if (process.env.NODE_ENV === "development") {
        console.log("[AuthContext] Mock logout.");
        setUser(null);
        localStorage.removeItem("uninest_user_data");
      } else {
        console.warn(
          "[AuthContext] Supabase not configured in PROD. Cannot perform real logout."
        );
        setUser(null);
      }
      setIsLoading(false);
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
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    setIsLoading(true);

    if (!user) throw new Error("No user logged in to update profile.");
    if (!isSupabaseReady) {
      if (process.env.NODE_ENV === "development") {
        console.log("[AuthContext] Mock profile update.");
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem(
          "uninest_user_data",
          JSON.stringify({ version: LOCAL_STORAGE_VERSION, user: updatedUser })
        );
      } else {
        const errorMsg =
          "Supabase is not configured. Profile updates are unavailable.";
        console.error(`[AuthContext] ERROR: ${errorMsg}`);
        setIsLoading(false);
        throw new Error(errorMsg);
      }
      setIsLoading(false);
      return;
    }
    try {
      const profileUpdates: Database["public"]["Tables"]["profiles"]["Update"] =
        {
          name: updates.name,
          university: updates.university,
          year: updates.year,
          bio: updates.bio,
          phone: updates.phone,
          profile_picture: updates.profilePicture,
          preferences: updates.preferences,
          location: updates.location,
          matchingPreferences: updates.matchingPreferences,
          verified: updates.verified,
        };

      const { error } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", user.id);

      if (error) {
        console.error("[AuthContext] Profile update error:", error);
        throw error;
      }
      setUser((prev) => (prev ? { ...prev, ...updates } : null));
      console.log("[AuthContext] Profile updated successfully.");
    } catch (error: any) {
      console.error("[AuthContext] Profile update process failed:", error);
      throw new Error(error.message || "Profile update failed");
    } finally {
      setIsLoading(false);
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
    resetPasswordForEmail: async (email: string) => {
      setIsLoading(true);
      try {
        if (!isSupabaseReady) {
          if (process.env.NODE_ENV === "development") {
            console.log(
              `[AuthContext] Mock password reset email sent to ${email}`
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));
            console.log("[AuthContext] Mock password reset successful.");
            return;
          } else {
            throw new Error(
              "Supabase is not configured. Password reset is unavailable."
            );
          }
        }
        console.log(
          `[AuthContext] Requesting password reset email for: ${email}`
        );
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          console.error(
            "[AuthContext] Supabase password reset request error:",
            error
          );
          throw error;
        }
        console.log(
          "[AuthContext] Password reset email requested successfully."
        );
      } catch (error: any) {
        console.error("[AuthContext] Password reset request failed:", error);
        throw new Error(
          error.message ||
            "Failed to send password reset email. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    updatePassword: async (newPassword: string) => {
      setIsLoading(true);
      try {
        if (!isSupabaseReady) {
          if (process.env.NODE_ENV === "development") {
            console.log("[AuthContext] Mock password update.");
            await new Promise((resolve) => setTimeout(resolve, 1000));
            console.log("[AuthContext] Mock password updated successfully.");
            return;
          } else {
            throw new Error(
              "Supabase is not configured. Password update is unavailable."
            );
          }
        }
        console.log("[AuthContext] Attempting to update password.");
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) {
          console.error("[AuthContext] Supabase password update error:", error);
          throw error;
        }
        console.log("[AuthContext] Password updated successfully.");
      } catch (error: any) {
        console.error("[AuthContext] Password update failed:", error);
        throw new Error(
          error.message || "Failed to update password. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    refreshUser: async () => {
      if (!isSupabaseReady || !supabaseUser?.id) {
        return;
      }
      await fetchUserProfile(supabaseUser.id);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
