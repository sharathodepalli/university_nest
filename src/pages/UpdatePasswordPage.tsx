import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  GraduationCap,
  Shield,
  Check,
  X,
  Info,
} from "lucide-react";

const UpdatePasswordPage: React.FC = () => {
  const { updatePassword, isLoading, isSupabaseReady, supabaseUser } =
    useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /[0-9]/.test(password),
      symbols: /[^A-Za-z0-9]/.test(password),
    };

    if (password) {
      score = Object.values(checks).filter(Boolean).length;
    }

    const levels = [
      { label: "Very Weak", color: "bg-red-500" },
      { label: "Weak", color: "bg-orange-500" },
      { label: "Fair", color: "bg-yellow-500" },
      { label: "Good", color: "bg-blue-500" },
      { label: "Strong", color: "bg-green-500" },
    ];

    return {
      score,
      ...(levels[score] || levels[0]),
      checks,
    };
  }, [password]);

  // Password match validation
  const passwordsMatch = confirmPassword && password === confirmPassword;

  // This effect checks if the user is in a valid state to update the password.
  // Supabase handles the session recovery from the password reset link.
  useEffect(() => {
    if (isSupabaseReady && !isLoading && !supabaseUser) {
      setError(
        "Invalid or expired password reset link. Please request a new one."
      );
      setTimeout(() => navigate("/login"), 5000);
    }
  }, [isSupabaseReady, isLoading, supabaseUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Enhanced validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (passwordStrength.score < 3) {
      setError(
        "Please choose a stronger password. Include uppercase, lowercase, numbers, and symbols."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(password);
      setSuccess(
        "Your password has been updated successfully! Redirecting to login..."
      );
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      console.error("Update password error:", err);
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">UniNest</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Password
          </h2>
          <p className="text-gray-600">
            Please create a strong, secure password for your account.
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Password Requirements:</p>
              <ul className="text-blue-700 space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Mix of uppercase and lowercase letters</li>
                <li>• Include numbers and symbols</li>
                <li>• Don't use common passwords</li>
              </ul>
            </div>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* New Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">
                    Password strength:
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength.score >= 4
                        ? "text-green-600"
                        : passwordStrength.score >= 3
                        ? "text-blue-600"
                        : passwordStrength.score >= 2
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>

                {/* Password Requirements Checklist */}
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                  {Object.entries({
                    "8+ characters": passwordStrength.checks.length,
                    Lowercase: passwordStrength.checks.lowercase,
                    Uppercase: passwordStrength.checks.uppercase,
                    Numbers: passwordStrength.checks.numbers,
                    Symbols: passwordStrength.checks.symbols,
                  }).map(([label, met]) => (
                    <div
                      key={label}
                      className={`flex items-center space-x-1 ${
                        met ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {met ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                  confirmPassword && !passwordsMatch
                    ? "border-red-300 focus:ring-red-500"
                    : confirmPassword && passwordsMatch
                    ? "border-green-300 focus:ring-green-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <div className="absolute right-3 top-3 flex items-center space-x-1">
                {confirmPassword && (
                  <div>
                    {passwordsMatch ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Passwords do not match
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 px-4 py-3 rounded-lg">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isSubmitting ||
              isLoading ||
              !!success ||
              !passwordsMatch ||
              passwordStrength.score < 3
            }
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting || isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Updating Password...</span>
              </div>
            ) : success ? (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Password Updated Successfully</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Update Password</span>
              </div>
            )}
          </button>

          {/* Help Text */}
          <div className="text-center text-sm text-gray-600">
            <p>
              After updating your password, you'll be redirected to login with
              your new credentials.
            </p>
          </div>
        </form>

        {/* Security Notice */}
        <div className="text-center text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p>
            <Shield className="w-3 h-3 inline mr-1" />
            Your password is encrypted and stored securely
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;
