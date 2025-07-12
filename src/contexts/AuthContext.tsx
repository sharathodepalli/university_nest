import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User as SupabaseAuthUser, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { User } from "../types"; // Import User from types/index.ts
import { useTabVisibility } from "../hooks/useTabVisibility";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  supabaseUser: SupabaseAuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearCachesAndRefresh: () => Promise<void>;
  isLoading: boolean;
  isSupabaseReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseAuthUser | null>(
    null
  );
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);
  const [registeredUserIds, setRegisteredUserIds] = useState<Set<string>>(
    new Set()
  );
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  useEffect(() => {
    const checkSupabase = async () => {
      if (isSupabaseConfigured()) {
        setIsSupabaseReady(true);
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("[AuthContext] Error getting initial session:", error);
          setIsLoading(false);
          return;
        }

        console.log(
          "[AuthContext] Initial session:",
          initialSession ? "SESSION" : "NO_SESSION",
          initialSession?.user?.id
        );
        setSession(initialSession);
        setSupabaseUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await fetchUserProfile(initialSession.user.id);
        } else {
          setUser(null);
        }
        setIsLoading(false);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          setIsLoading(true);
          console.log(
            `[AuthContext] Auth state changed - event: ${event}, session: ${
              newSession ? "YES" : "NO"
            }, userId: ${newSession?.user?.id}`
          );
          setSession(newSession);
          setSupabaseUser(newSession?.user ?? null);

          if (newSession?.user) {
            const skipAutoCreate = registeredUserIds.has(newSession.user.id);
            console.log(
              `[AuthContext] Fetching profile for auth change, skipAutoCreate: ${skipAutoCreate}`
            );
            await fetchUserProfile(newSession.user.id, skipAutoCreate);
          } else {
            console.log(
              `[AuthContext] No user in session, setting user to null`
            );
            setUser(null);
          }
          setIsLoading(false);
        });

        return () => {
          subscription?.unsubscribe();
        };
      } else {
        setIsLoading(false);
      }
    };

    // Add loading timeout protection
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn("[AuthContext] Loading timeout reached, forcing stop");
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    // Initial check
    checkSupabase();

    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [registeredUserIds]);

  // Separate useEffect for tab visibility to avoid dependency issues
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && supabaseUser?.id && user === null) {
        console.log(
          "[AuthContext] Tab became visible, user not loaded, refreshing"
        );
        // Only refresh if user is not already loaded
        setTimeout(() => {
          fetchUserProfile(supabaseUser.id);
        }, 500);
      }
    };

    // Add visibility event listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [supabaseUser?.id, user]); // Include user state to avoid unnecessary calls

  const fetchUserProfile = async (userId: string, skipAutoCreate = false) => {
    // Less aggressive throttling - only 1 second
    const now = Date.now();
    if (now - lastFetchTime < 1000) {
      console.log("[AuthContext] Throttling profile fetch, too recent");
      return;
    }
    setLastFetchTime(now);

    console.log(
      `[AuthContext] Starting fetchUserProfile for userId: ${userId}, skipAutoCreate: ${skipAutoCreate}`
    );

    try {
      const { data, error, status } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      console.log(
        `[AuthContext] Profile fetch result - data: ${
          data ? "FOUND" : "NULL"
        }, error: ${error ? error.message : "NONE"}, status: ${status}`
      );

      if (error && status === 406) {
        // Profile does not exist
        if (skipAutoCreate) {
          console.log(
            `[AuthContext] Profile not found for user ${userId}, skipping auto-creation.`
          );
          setUser(null);
          return;
        }

        // Auto-create profile only if not during registration
        console.warn(
          `[AuthContext] Profile not found for user ${userId}. Creating one.`
        );

        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          console.error(
            "[AuthContext] Could not get session for profile creation:",
            sessionError
          );
          setUser(null);
          return;
        }

        const userToCreate = sessionData.session.user;
        const defaultName = userToCreate.email?.split("@")[0] || "New User";

        const { error: createError } = await supabase.from("profiles").insert({
          id: userToCreate.id,
          email: userToCreate.email,
          name: defaultName,
          university: "Not specified",
          year: "Not specified",
          bio: "",
          // Explicitly set verification fields to false for new profiles
          verified: false,
          student_verified: false,
          verification_status: "unverified",
          student_email: null,
          verification_method: null,
          verified_at: null,
          // Ensure matching_preferences is set for new profiles
          matching_preferences: null, // Default to null for new profiles, matches DB schema
        });

        if (createError) {
          // Handle race condition: if profile already exists, fetch it instead
          if (createError.code === "23505") {
            console.log(
              `[AuthContext] Profile already exists for user ${userId}, fetching existing profile`
            );
            // Try to fetch the existing profile
            const { data: existingData, error: fetchError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userId)
              .single();

            if (fetchError) {
              console.error(
                `[AuthContext] Error fetching existing profile:`,
                fetchError
              );
              throw fetchError;
            }

            // Transform existing profile data
            const transformedExistingUser: User = {
              id: existingData.id,
              name: existingData.name || "",
              email: existingData.email || "",
              university: existingData.university || "Not specified",
              year: existingData.year || "Not specified",
              bio: existingData.bio || "",
              profilePicture: existingData.profile_picture || undefined,
              verified: existingData.verified || false,
              student_verified: existingData.student_verified || false,
              student_email: existingData.student_email || undefined,
              verification_status:
                existingData.verification_status || "unverified",
              verification_method:
                existingData.verification_method || undefined,
              verified_at: existingData.verified_at
                ? new Date(existingData.verified_at)
                : undefined,
              createdAt: existingData.created_at
                ? new Date(existingData.created_at)
                : new Date(),
              phone: existingData.phone || undefined,
              preferences: existingData.preferences || undefined,
              location: existingData.location || undefined,
              matchingPreferences:
                existingData.matching_preferences || undefined,
            };

            setUser(transformedExistingUser);
            return;
          } else {
            console.error(
              `[AuthContext] Error creating profile for user ${userId}:`,
              createError
            );
            throw createError;
          }
        }

        // Re-fetch the profile after creating it
        const { data: newData, error: newError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (newError) throw newError;
        console.log(
          `[AuthContext] Profile created and fetched successfully for user ${userId}`
        );

        // Transform the auto-created profile data too
        const transformedNewUser: User = {
          id: newData.id,
          name: newData.name || "",
          email: newData.email || "",
          university: newData.university || "Not specified",
          year: newData.year || "Not specified",
          bio: newData.bio || "",
          profilePicture: newData.profile_picture || undefined,
          verified: newData.verified || false,
          student_verified: newData.student_verified || false,
          student_email: newData.student_email || undefined,
          verification_status: newData.verification_status || "unverified",
          verification_method: newData.verification_method || undefined,
          verified_at: newData.verified_at
            ? new Date(newData.verified_at)
            : undefined,
          createdAt: newData.created_at
            ? new Date(newData.created_at)
            : new Date(),
          phone: newData.phone || undefined,
          preferences: newData.preferences || undefined,
          location: newData.location || undefined,
          matchingPreferences: newData.matching_preferences || undefined,
        };

        setUser(transformedNewUser);
        return;
      }

      if (error && status !== 406) {
        console.error(
          `[AuthContext] Profile fetch error (status: ${status}):`,
          error
        );
        throw error;
      }

      if (data) {
        console.log(
          `[AuthContext] Profile found and set for user ${userId}:`,
          data.name
        );
        console.log("[AuthContext] Raw profile data from database:", data);

        // Transform snake_case database fields to camelCase for frontend
        const transformedUser: User = {
          id: data.id,
          name: data.name || "",
          email: data.email || "",
          university: data.university || "Not specified",
          year: data.year || "Not specified",
          bio: data.bio || "",
          profilePicture: data.profile_picture || undefined, // snake_case to camelCase
          verified: data.verified || false,
          student_verified: data.student_verified || false,
          student_email: data.student_email || undefined,
          verification_status: data.verification_status || "unverified",
          verification_method: data.verification_method || undefined,
          verified_at: data.verified_at
            ? new Date(data.verified_at)
            : undefined,
          createdAt: data.created_at ? new Date(data.created_at) : new Date(),
          phone: data.phone || undefined,
          preferences: data.preferences || undefined,
          location: data.location || undefined,
          matchingPreferences: data.matching_preferences || undefined, // snake_case to camelCase
        };

        console.log("[AuthContext] Transformed user data:", transformedUser);
        setUser(transformedUser);
      } else {
        console.warn(
          `[AuthContext] No profile data returned for user ${userId}`
        );
        setUser(null);
      }
    } catch (error) {
      console.error(
        `[AuthContext] Error in fetchUserProfile for user ${userId}:`,
        error
      );
      // Ensure user is logged out of UI if profile fetch fails critically
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    console.log(`[AuthContext] Starting login for email: ${email}`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(`[AuthContext] Login error:`, error);
      throw error;
    }

    console.log(
      `[AuthContext] Login successful for user: ${data.user?.id}, session: ${
        data.session ? "YES" : "NO"
      }`
    );

    // The auth state change will trigger fetchUserProfile automatically
    // But let's also try to fetch immediately to ensure we have the profile
    if (data.user?.id) {
      console.log(
        `[AuthContext] Attempting immediate profile fetch after login`
      );
      await fetchUserProfile(data.user.id);
    }
  };

  const register = async (userData: Partial<User> & { password: string }) => {
    const { email, password, ...profileData } = userData;
    if (!email || !password) {
      throw new Error("Email and password are required for registration.");
    }

    try {
      // Step 1: Sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }
      if (!authData.user) {
        throw new Error("Registration failed: no user returned.");
      }

      const userId = authData.user.id;

      // Track that this user is being registered to prevent auto-creation
      setRegisteredUserIds((prev) => new Set(prev).add(userId));

      // Step 2: Manually create the profile in the public.profiles table
      const defaultName = email.split("@")[0] || "New User";

      console.log("[Register] Profile data received:", profileData);

      // Prepare profile data, mapping camelCase to snake_case for DB
      const profileToInsert: any = {
        // Using `any` for flexible property assignment
        id: userId,
        email: authData.user.email,
        name: profileData.name || defaultName,
        university: profileData.university || "Not specified",
        year: profileData.year || "Not specified",
        bio: profileData.bio || "",
        // Explicitly set verification fields to false for new registrations
        verified: false,
        student_verified: false,
        verification_status: "unverified",
        student_email: null,
        verification_method: null,
        verified_at: null,
        phone: profileData.phone || null,
        profile_picture: profileData.profilePicture || null, // Map profilePicture to profile_picture
        location: profileData.location || null,
        preferences: profileData.preferences || null,
      };

      console.log("[Register] Profile data to insert:", profileToInsert);

      // Map matchingPreferences (camelCase) to matching_preferences (snake_case)
      if (profileData.matchingPreferences !== undefined) {
        profileToInsert.matching_preferences = profileData.matchingPreferences;
      } else {
        profileToInsert.matching_preferences = null; // Default to null if not provided
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert(profileToInsert);

      console.log("[Register] Database insert result - error:", profileError);

      if (profileError) {
        // Handle race condition: if profile already exists, just continue
        if (profileError.code === "23505") {
          console.log(
            `[Register] Profile already exists for user ${userId}, continuing with existing profile`
          );
        } else {
          console.error("Failed to create user profile:", profileError);
          throw profileError;
        }
      }

      // Step 3: Fetch the newly created profile to update the context
      await fetchUserProfile(userId, true); // Skip auto-create since we just created it

      // Clean up the tracking after successful registration (or failure)
      setTimeout(() => {
        setRegisteredUserIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }, 5000); // Clean up after 5 seconds
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!supabaseUser) throw new Error("No user logged in");

    // Create a new object for database update, mapping camelCase to snake_case
    // We use `Omit` to remove the camelCase `profilePicture` and `matchingPreferences`
    // and then add their snake_case counterparts.
    type UpdatesForDb = Omit<
      Partial<User>,
      "profilePicture" | "matchingPreferences"
    > & {
      profile_picture?: string | null;
      matching_preferences?: (typeof updates)["matchingPreferences"];
    };

    // CORRECTED: Explicitly build updatesForDb to avoid type conflicts with Omit
    const updatesForDb: UpdatesForDb = {};

    // Copy properties from 'updates' that do not need renaming
    for (const key in updates) {
      if (key !== "profilePicture" && key !== "matchingPreferences") {
        // Ensure the key is a valid property of UpdatesForDb (type assertion for safety)
        (updatesForDb as any)[key] = (updates as any)[key];
      }
    }

    // Map camelCase to snake_case for profilePicture
    if (updates.profilePicture !== undefined) {
      updatesForDb.profile_picture = updates.profilePicture;
    }

    // Map camelCase to snake_case for matchingPreferences
    if (updates.matchingPreferences !== undefined) {
      updatesForDb.matching_preferences = updates.matchingPreferences;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updatesForDb) // Use the mapped object
      .eq("id", supabaseUser.id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    if (data) {
      // Transform the updated profile data
      const transformedUpdatedUser: User = {
        id: data.id,
        name: data.name || "",
        email: data.email || "",
        university: data.university || "Not specified",
        year: data.year || "Not specified",
        bio: data.bio || "",
        profilePicture: data.profile_picture || undefined,
        verified: data.verified || false,
        student_verified: data.student_verified || false,
        student_email: data.student_email || undefined,
        verification_status: data.verification_status || "unverified",
        verification_method: data.verification_method || undefined,
        verified_at: data.verified_at ? new Date(data.verified_at) : undefined,
        createdAt: data.created_at ? new Date(data.created_at) : new Date(),
        phone: data.phone || undefined,
        preferences: data.preferences || undefined,
        location: data.location || undefined,
        matchingPreferences: data.matching_preferences || undefined,
      };

      setUser(transformedUpdatedUser);
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`, // URL to your password update page
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    if (!supabaseUser) throw new Error("No user logged in");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const refreshUser = async () => {
    if (supabaseUser) {
      await fetchUserProfile(supabaseUser.id);
    }
  };

  const clearCachesAndRefresh = async () => {
    // In a real app, you might clear other client-side caches here
    console.log("Clearing caches and refreshing user data...");
    await refreshUser();
  };

  // Handle tab visibility changes to refresh stale data
  useTabVisibility({
    onVisible: () => {
      console.log("[AuthContext] Tab became visible, refreshing user data");
      if (supabaseUser && !isLoading) {
        refreshUser().catch(console.error);
      }
    },
    onFocus: () => {
      console.log("[AuthContext] Window focused");
      // Clear any stuck loading states after 30 seconds
      setTimeout(() => {
        if (isLoading) {
          console.warn(
            "[AuthContext] Forcing loading state to false after timeout"
          );
          setIsLoading(false);
        }
      }, 30000);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        supabaseUser,
        login,
        register,
        logout,
        updateProfile,
        resetPasswordForEmail,
        updatePassword,
        refreshUser,
        clearCachesAndRefresh,
        isLoading,
        isSupabaseReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
