import React from "react";
import { useAuth } from "../contexts/AuthContext";

const AuthDebugger: React.FC = () => {
  const { user, session, supabaseUser, isLoading, isSupabaseReady } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">Auth Debug Info</h3>
      <div className="space-y-1">
        <div>
          <strong>isLoading:</strong> {isLoading ? "true" : "false"}
        </div>
        <div>
          <strong>isSupabaseReady:</strong> {isSupabaseReady ? "true" : "false"}
        </div>
        <div>
          <strong>session:</strong>{" "}
          {session ? `YES (${session.user?.id?.slice(0, 8)}...)` : "NO"}
        </div>
        <div>
          <strong>supabaseUser:</strong>{" "}
          {supabaseUser ? `YES (${supabaseUser.id?.slice(0, 8)}...)` : "NO"}
        </div>
        <div>
          <strong>user profile:</strong> {user ? `YES (${user.name})` : "NO"}
        </div>
        {user && (
          <div className="mt-2 text-gray-300">
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>University:</strong> {user.university}
            </div>
            <div>
              <strong>Verified:</strong> {user.verified ? "Yes" : "No"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthDebugger;
