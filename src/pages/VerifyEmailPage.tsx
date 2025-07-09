import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { verificationService } from "../lib/verificationService";
import { useAuth } from "../contexts/AuthContext";

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "expired"
  >("loading");
  const [message, setMessage] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    // Simulate token verification process
    // In production, this would call your Supabase function to verify the token
    verifyToken(token);
  }, [token]);

  const verifyToken = async (verificationToken: string) => {
    try {
      console.log("Verifying token:", verificationToken);

      // Call the new Edge Function to verify the token
      const result = await verificationService.verifyEmailToken(
        verificationToken
      );

      if (result.success) {
        setStatus("success");
        setMessage(
          "Email verification successful! Your student status has been verified."
        );

        // Refresh user data to update verification status in UI
        if (refreshUser) {
          try {
            await refreshUser();
          } catch (error) {
            console.error(
              "Failed to refresh user data after verification:",
              error
            );
          }
        }
      } else {
        setStatus("error");
        setMessage(
          result.message ||
            "Verification failed. Please try requesting a new verification email."
        );
      }
    } catch (error) {
      console.error("Token verification error:", error);
      setStatus("error");
      setMessage(
        "Verification failed. Please try requesting a new verification email."
      );
    }
  };

  const handleReturnToVerification = () => {
    navigate("/verification");
  };

  const handleGoToDashboard = () => {
    navigate("/browse");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Status Icon */}
        <div className="mb-6">
          {status === "loading" && (
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            </div>
          )}
          {status === "success" && (
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
          )}
          {(status === "error" || status === "expired") && (
            <div className="flex justify-center">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {status === "loading" && "Verifying Email..."}
          {status === "success" && "Email Verified!"}
          {status === "error" && "Verification Failed"}
          {status === "expired" && "Link Expired"}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-8">
          {status === "loading" &&
            "Please wait while we verify your email address..."}
          {message}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          {status === "success" && (
            <button
              onClick={handleGoToDashboard}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Continue to UniNest
            </button>
          )}

          {(status === "error" || status === "expired") && (
            <button
              onClick={handleReturnToVerification}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Request New Verification Email
            </button>
          )}

          <button
            onClick={() => navigate("/")}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </div>

        {/* Additional Info */}
        {status === "success" && (
          <div className="mt-8 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              🎉 Congratulations! You now have access to:
            </p>
            <ul className="text-sm text-green-600 mt-2 space-y-1">
              <li>• Student-verified housing listings</li>
              <li>• Direct messaging with hosts</li>
              <li>• Priority booking access</li>
              <li>• Enhanced privacy features</li>
            </ul>
          </div>
        )}

        {(status === "error" || status === "expired") && (
          <div className="mt-8 p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700">
              Having trouble? Contact our support team at support@uninest.com
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
