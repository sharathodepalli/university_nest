import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Mail,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  GraduationCap,
  Shield,
  Clock,
  Info,
} from "lucide-react";
import { validateInput, emailSchema } from "../lib/validation";

const ForgotPasswordPage: React.FC = () => {
  const { resetPasswordForEmail, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors([]);
    setSuccess("");
    setIsSubmitting(true);

    const validationResult = validateInput(emailSchema, { email });
    if (!validationResult.success) {
      setValidationErrors(validationResult.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      await resetPasswordForEmail(email);
      setSuccess(
        "If an account with this email exists, a password reset link has been sent."
      );
    } catch (err: any) {
      console.error("Password reset error:", err);
      // Avoid disclosing whether the user exists
      setSuccess(
        "If an account with this email exists, a password reset link has been sent."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-blue-600 hover:text-blue-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>

          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">UniNest</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Forgot Your Password?
          </h2>
          <p className="text-gray-600">
            No worries! Enter your email address and we'll send you a secure
            link to reset your password.
          </p>
        </div>

        {/* Reset Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How it works:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Enter your email address below</li>
                <li>Check your email for a reset link</li>
                <li>Click the link to create a new password</li>
              </ol>
            </div>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Email Input */}
          <div>
            <label
              htmlFor="email-address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="flex flex-col space-y-1 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
              {validationErrors.map((msg, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 px-4 py-3 rounded-lg">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-1">
                      What's next?
                    </p>
                    <ul className="text-yellow-700 space-y-1">
                      <li>• Check your email inbox (and spam folder)</li>
                      <li>• Click the reset link within 1 hour</li>
                      <li>• Create a new secure password</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading || !!success}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting || isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending Reset Link...</span>
              </div>
            ) : success ? (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Email Sent Successfully</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Send Password Reset Link</span>
              </div>
            )}
          </button>

          {/* Additional Help */}
          <div className="text-center text-sm text-gray-600">
            <p>Didn't receive the email?</p>
            <div className="mt-2 space-x-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !email}
                className="text-blue-600 hover:text-blue-500 font-medium disabled:text-gray-400"
              >
                Resend email
              </button>
              <span className="text-gray-300">|</span>
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Try logging in
              </Link>
            </div>
          </div>
        </form>

        {/* Security Notice */}
        <div className="text-center text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p>
            <Shield className="w-3 h-3 inline mr-1" />
            Reset links expire after 1 hour for your security
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
