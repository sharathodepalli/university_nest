import React, {
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
          console.log(
            "[AuthContext] Auth state changed:",
            newSession ? "SESSION" : "NO_SESSION",
            newSession?.user?.id
          );
          setSession(newSession);
          setSupabaseUser(newSession?.user ?? null);

          if (newSession?.user) {
            await fetchUserProfile(newSession.user.id);
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
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error, status } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUser(data as User);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
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

    // Step 2: Manually create the profile in the public.profiles table
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email: authData.user.email,
      ...profileData,
    });

    if (profileError) {
      // This is a critical error. We should ideally handle this case,
      // perhaps by deleting the auth user if the profile creation fails.
      // For now, we'll just throw the error.
      console.error("Failed to create user profile:", profileError);
      throw profileError;
    }

    // Step 3: Fetch the newly created profile to update the context
    await fetchUserProfile(authData.user.id);
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
    if (error) throw error;
    if (data) setUser(data as User);
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const refreshUser = async () => {
    if (supabaseUser) {
      await fetchUserProfile(supabaseUser.id);
    }
  };

  const clearCachesAndRefresh = async () => {
    // This is a placeholder for more complex cache clearing logic
    console.log("Clearing caches and refreshing user data...");
    await refreshUser();
  };

  const value = {
    user,
    supabaseUser,
    session,
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
