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
//ll

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
          setIsLoading(false);
          return;
        }

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
        } = supabase.auth.onAuthStateChange(async (_, newSession) => {
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
        setIsLoading(false);
      }
    }, 5000); // Reduced to 5 seconds

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
    // Throttling - only 1 second
    const now = Date.now();
    if (now - lastFetchTime < 1000) {
      return;
    }
    setLastFetchTime(now);

    try {
      const { data, error, status } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && status === 406) {
        // Profile does not exist
        if (skipAutoCreate) {
          setUser(null);
          return;
        }

        // Auto-create profile only if not during registration
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
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
          verified: false,
          student_verified: false,
          verification_status: "unverified",
          student_email: null,
          verification_method: null,
          verified_at: null,
          matching_preferences: null,
        });

        if (createError) {
          // Handle race condition: if profile already exists, fetch it instead
          if (createError.code === "23505") {
            const { data: existingData, error: fetchError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userId)
              .single();

            if (fetchError) {
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

        // Transform the auto-created profile data
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
        throw error;
      }

      if (data) {
        // Transform snake_case database fields to camelCase for frontend
        const transformedUser: User = {
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
          verified_at: data.verified_at
            ? new Date(data.verified_at)
            : undefined,
          createdAt: data.created_at ? new Date(data.created_at) : new Date(),
          phone: data.phone || undefined,
          preferences: data.preferences || undefined,
          location: data.location || undefined,
          matchingPreferences: data.matching_preferences || undefined,
        };

        setUser(transformedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // The auth state change will trigger fetchUserProfile automatically
    if (data.user?.id) {
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

      // Step 2: Create the profile in the database
      const defaultName = email.split("@")[0] || "New User";

      // Prepare profile data, mapping camelCase to snake_case for DB
      const profileToInsert: any = {
        id: userId,
        email: authData.user.email,
        name: profileData.name || defaultName,
        university: profileData.university || "Not specified",
        year: profileData.year || "Not specified",
        bio: profileData.bio || "",
        verified: false,
        student_verified: false,
        verification_status: "unverified",
        student_email: null,
        verification_method: null,
        verified_at: null,
        phone: profileData.phone || null,
        profile_picture: profileData.profilePicture || null,
        location: profileData.location || null,
        preferences: profileData.preferences || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Map matchingPreferences (camelCase) to matching_preferences (snake_case)
      if (profileData.matchingPreferences !== undefined) {
        profileToInsert.matching_preferences = profileData.matchingPreferences;
      } else {
        profileToInsert.matching_preferences = null;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert(profileToInsert)
        .select()
        .single();

      if (profileError) {
        // Handle race condition: if profile already exists, handle email conflict
        if (
          profileError.code === "23505" ||
          profileError.message?.includes("duplicate key")
        ) {
          // Try to find existing profile by email
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", authData.user.email)
            .single();

          if (existingProfile && existingProfile.id !== userId) {
            // Delete the old profile and create new one with correct ID AND new form data
            await supabase
              .from("profiles")
              .delete()
              .eq("id", existingProfile.id);

            const updatedProfile = {
              ...profileToInsert,
              id: userId,
            };

            const { error: updateError } = await supabase
              .from("profiles")
              .insert(updatedProfile);

            if (updateError) {
              throw updateError;
            }
          } else if (existingProfile && existingProfile.id === userId) {
            // Update the existing profile with new form data
            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                name: profileToInsert.name,
                university: profileToInsert.university,
                year: profileToInsert.year,
                bio: profileToInsert.bio,
                phone: profileToInsert.phone,
                profile_picture: profileToInsert.profile_picture,
                location: profileToInsert.location,
                preferences: profileToInsert.preferences,
                matching_preferences: profileToInsert.matching_preferences,
                updated_at: new Date().toISOString(),
              })
              .eq("id", userId);

            if (updateError) {
              throw updateError;
            }
          }
        } else {
          throw profileError;
        }
      }

      // Step 3: Fetch the newly created profile to update the context
      await fetchUserProfile(userId, true);

      // Clean up the tracking after successful registration
      setTimeout(() => {
        setRegisteredUserIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }, 5000);
    } catch (error) {
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
    await refreshUser();
  };

  // Handle tab visibility changes to refresh stale data
  useTabVisibility({
    onVisible: () => {
      if (supabaseUser && !isLoading) {
        refreshUser();
      }
    },
    onFocus: () => {
      // Clear any stuck loading states after 30 seconds
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 5000); // Reduced timeout
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
