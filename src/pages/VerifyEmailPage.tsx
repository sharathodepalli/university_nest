import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { verificationService } from "../lib/verificationService";
import { useAuth } from "../contexts/AuthContext";

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, refreshUser } = useAuth();

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "expired" | "verifying"
  >("verifying");
  const [message, setMessage] = useState(
    "Verifying your email, please wait..."
  );

  const token = searchParams.get("token");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. No token provided.");
        return;
      }

      console.log(`[VerifyEmailPage] Attempting to verify token: ${token}`);
      try {
        // The service calls the backend function which is SECURITY DEFINER,
        // so it doesn't require a session to run the update.
        const result = await verificationService.verifyEmailToken(token);

        if (result.success) {
          console.log(
            "[VerifyEmailPage] Verification successful in backend.",
            result
          );
          setStatus("success");

          // Check if a user session is active in the browser
          if (session?.user && refreshUser) {
            console.log(
              "[VerifyEmailPage] User is logged in. Refreshing user data and redirecting."
            );
            setMessage(
              "Email verification successful! Redirecting to your profile..."
            );
            await refreshUser();
            setTimeout(() => navigate("/profile"), 3000);
          } else {
            // If user is NOT logged in, show a message to log in.
            console.log(
              "[VerifyEmailPage] User is not logged in. Displaying message to log in."
            );
            setMessage(
              "Your email has been verified! Please log in to your account to see your updated profile."
            );
          }
        } else {
          console.warn(
            "[VerifyEmailPage] Verification failed in backend.",
            result
          );
          setStatus("error");
          setMessage(
            result.message ||
              "Verification failed. The link may be invalid or expired."
          );
        }
      } catch (error: any) {
        console.error("[VerifyEmailPage] Unexpected error:", error);
        setStatus("error");
        setMessage("An unexpected error occurred. Please try again later.");
      }
    };

    verify();
  }, [token, session, refreshUser, navigate]);

  const handleReturnToVerification = () => {
    navigate("/verification");
  };

  const handleGoToDashboard = () => {
    navigate("/browse");
  };

  const handleGoToLogin = () => {
    navigate("/login");
  };

  const renderContent = () => {
    switch (status) {
      case "verifying":
        return (
          <div className="flex justify-center">
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
          </div>
        );
      case "success":
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Success!</h2>
            <p className="text-gray-700">{message}</p>
            {!session?.user && (
              <button
                onClick={handleGoToLogin}
                className="mt-6 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
              >
                Go to Login
              </button>
            )}
          </div>
        );
      case "error":
      case "expired":
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Verification Failed
            </h2>
            <p className="text-gray-700">{message}</p>
            <button
              onClick={handleReturnToVerification}
              className="mt-6 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Request New Verification Email
            </button>
          </div>
        );
    }
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
