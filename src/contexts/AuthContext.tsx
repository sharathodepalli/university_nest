import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode, // Ensure ReactNode is imported
} from "react";
import { User as SupabaseAuthUser, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { User } from "../types";
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

// Corrected type definition for AuthProvider props
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
        } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          setIsLoading(true);
          console.log(
            "[AuthContext] Auth state changed:",
            newSession ? "SESSION" : "NO_SESSION",
            newSession?.user?.id
          );
          setSession(newSession);
          setSupabaseUser(newSession?.user ?? null);

          if (newSession?.user) {
            const skipAutoCreate = registeredUserIds.has(newSession.user.id);
            await fetchUserProfile(newSession.user.id, skipAutoCreate);
          } else {
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
      if (!document.hidden && supabaseUser?.id) {
        console.log("[AuthContext] Tab became visible, refreshing user data");
        // Directly call fetchUserProfile, it has its own throttling
        fetchUserProfile(supabaseUser.id);
      }
    };

    // Add visibility event listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [supabaseUser?.id]); // Only depend on user ID, not the whole session

  const fetchUserProfile = async (userId: string, skipAutoCreate = false) => {
    // Throttle rapid successive calls
    const now = Date.now();
    if (now - lastFetchTime < 2000) {
      console.log("[AuthContext] Throttling profile fetch, too recent");
      return;
    }
    setLastFetchTime(now);
    setIsLoading(true); // Set loading true at the start of the fetch

    try {
      const { data, error, status } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

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
          throw new Error("Could not get session to create profile.");
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

            setUser(existingData as User);
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
        setUser(newData as User);
        return;
      }

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUser(data as User);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Ensure user is logged out of UI if profile fetch fails critically
      setUser(null);
    } finally {
      setIsLoading(false); // Ensure loading is stopped after fetch completes or errors
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
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
      const { error: profileError } = await supabase.from("profiles").insert({
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
        // Apply any other profile data AFTER setting defaults
        phone: profileData.phone || null,
        profilePicture: profileData.profilePicture || null,
        location: profileData.location || null,
        preferences: profileData.preferences || null,
        matchingPreferences: profileData.matchingPreferences || null,
      });

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

      // Clean up the tracking after successful registration
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
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", supabaseUser.id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    if (data) {
      setUser(data as User);
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
