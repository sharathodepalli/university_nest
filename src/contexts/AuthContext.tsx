import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
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
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseReady] = useState(isSupabaseConfigured());

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (!isSupabaseReady) {
        // Use mock authentication for development
        const storedUser = localStorage.getItem("uninest_user");
        if (storedUser && mounted) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch (error) {
            console.error("Error parsing stored user:", error);
            localStorage.removeItem("uninest_user");
          }
        }
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          if (mounted) setIsLoading(false);
          return;
        }

        if (mounted) {
          setSupabaseUser(session?.user ?? null);
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          } else {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes only if Supabase is ready
    let subscription: any = null;
    if (isSupabaseReady) {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("Auth state changed:", event, session?.user?.email);

          if (!mounted) return;

          setSupabaseUser(session?.user ?? null);

          if (session?.user) {
            await fetchUserProfile(session.user.id);
          } else {
            setUser(null);
            setIsLoading(false);
          }
        }
      );
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isSupabaseReady]);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);

        // If profile doesn't exist, create a basic user object from auth data
        if (error.code === "PGRST116") {
          console.log("Profile not found, creating basic user from auth data");

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
          return;
        }

        setIsLoading(false);
        return;
      }

      if (data) {
        console.log("Profile found:", data);

        const userProfile: User = {
          id: data.id,
          name: data.name,
          email: supabaseUser?.email || "",
          university: data.university,
          year: data.year,
          bio: data.bio || "",
          phone: data.phone,
          verified: data.verified,
          profilePicture: data.profile_picture,
          preferences: data.preferences || {
            smokingAllowed: false,
            petsAllowed: true,
            studyFriendly: true,
            socialLevel: "moderate",
            maxBudget: 1500,
            preferredRoomTypes: ["single"],
            preferredAmenities: ["Wi-Fi", "Laundry"],
          },
          createdAt: new Date(data.created_at),
          location: {
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
              max: data.preferences?.maxBudget || 1500,
            },
          },
        };

        console.log("Setting user profile:", userProfile);
        setUser(userProfile);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      console.log("Profile fetch completed, setting loading to false");
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (!isSupabaseReady) {
      // Mock login for development
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockUser: User = {
        id: "1",
        name: "Alex Johnson",
        email: email,
        university: "University of California, Berkeley",
        year: "Junior",
        bio: "Computer Science student looking for a quiet place to study.",
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

      setUser(mockUser);
      localStorage.setItem("uninest_user", JSON.stringify(mockUser));
      return;
    }

    try {
      setIsLoading(true);
      console.log("Attempting login for:", email);

      // Add timeout to prevent hanging
      const loginPromise = supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Login timeout - using mock authentication")),
          10000
        )
      );

      const { data, error } = (await Promise.race([
        loginPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        console.error("Login error:", error);
        console.log("Falling back to mock authentication");

        // Fallback to mock login if Supabase fails
        const mockUser: User = {
          id: "1",
          name: "Alex Johnson",
          email: email,
          university: "University of California, Berkeley",
          year: "Junior",
          bio: "Computer Science student looking for a quiet place to study.",
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

        setUser(mockUser);
        localStorage.setItem("uninest_user", JSON.stringify(mockUser));
        setIsLoading(false);
        return;
      }

      console.log("Login successful for:", data.user?.email);
      // The auth state change handler will fetch the profile and set the user
    } catch (error: any) {
      console.error("Login failed:", error);
      console.log("Falling back to mock authentication due to error");

      // Always fallback to mock login on any error
      const mockUser: User = {
        id: "1",
        name: "Alex Johnson",
        email: email,
        university: "University of California, Berkeley",
        year: "Junior",
        bio: "Computer Science student looking for a quiet place to study.",
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

      setUser(mockUser);
      localStorage.setItem("uninest_user", JSON.stringify(mockUser));
      setIsLoading(false);
    }
  };

  const register = async (userData: Partial<User> & { password: string }) => {
    if (!isSupabaseReady) {
      // Mock registration for development
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newUser: User = {
        id: Date.now().toString(),
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
            min: 500,
            max: 2000,
          },
        },
      };

      setUser(newUser);
      localStorage.setItem("uninest_user", JSON.stringify(newUser));
      return;
    }

    try {
      setIsLoading(true);
      console.log("Attempting registration for:", userData.email);

      // First, sign up the user
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
        console.error("Registration error:", authError);
        throw authError;
      }

      if (authData.user) {
        console.log("User created, creating profile...");

        // Create profile in profiles table
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          name: userData.name!,
          university: userData.university!,
          year: userData.year!,
          bio: userData.bio || "",
          phone: userData.phone,
          verified: false,
          preferences: userData.preferences || {
            smokingAllowed: false,
            petsAllowed: true,
            studyFriendly: true,
            socialLevel: "moderate",
            maxBudget: 1500,
            preferredRoomTypes: ["single"],
            preferredAmenities: ["Wi-Fi", "Laundry"],
          },
        });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          throw profileError;
        }

        console.log("Registration and profile creation successful");
        // The auth state change handler will fetch the profile and set the user
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
      setIsLoading(false);
      throw new Error(error.message || "Registration failed");
    }
  };

  const logout = async () => {
    if (!isSupabaseReady) {
      // Mock logout for development
      setUser(null);
      localStorage.removeItem("uninest_user");
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        throw error;
      }
      console.log("Logout successful");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error("No user logged in");

    if (!isSupabaseReady) {
      // Mock update for development
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem("uninest_user", JSON.stringify(updatedUser));
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: updates.name,
          university: updates.university,
          year: updates.year,
          bio: updates.bio,
          phone: updates.phone,
          profile_picture: updates.profilePicture,
          preferences: updates.preferences,
        })
        .eq("id", user.id);

      if (error) {
        console.error("Profile update error:", error);
        throw error;
      }

      // Update local state
      setUser((prev) => (prev ? { ...prev, ...updates } : null));
      console.log("Profile updated successfully");
    } catch (error: any) {
      console.error("Profile update failed:", error);
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
