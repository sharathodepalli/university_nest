import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User as SupabaseAuthUser, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { User } from "../types";

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

    // Initial check
    checkSupabase();
  }, [registeredUserIds]);

  const fetchUserProfile = async (userId: string, skipAutoCreate = false) => {
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
          // Add any other default fields here
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
        ...profileData,
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
