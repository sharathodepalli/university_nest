import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePrivacy } from "../hooks/usePrivacy";
import {
  Shield,
  ArrowLeft,
  Info,
  CheckCircle,
  AlertCircle,
  Globe,
  Users,
  Lock,
  Mail,
  MessageCircle,
} from "lucide-react";

const PrivacySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = usePrivacy();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Settings are automatically saved by the usePrivacy hook
      setSuccess("Privacy settings updated successfully!");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      console.error("Privacy settings update error:", err);
      setError(
        err.message || "Failed to update privacy settings. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Privacy Settings
                </h1>
                <p className="text-gray-600 mt-1">
                  Control your privacy and data sharing preferences
                </p>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="p-6 space-y-8">
            {/* Profile Visibility */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-gray-600" />
                Profile Visibility
              </h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-3">
                  Choose who can see your profile information
                </div>
                {[
                  {
                    value: "public",
                    label: "Public",
                    desc: "Anyone can see your profile",
                  },
                  {
                    value: "university",
                    label: "University Only",
                    desc: "Only students from your university",
                  },
                  {
                    value: "private",
                    label: "Private",
                    desc: "Only you can see your profile",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="profileVisibility"
                      value={option.value}
                      checked={settings.profileVisibility === option.value}
                      onChange={() =>
                        handleSettingChange("profileVisibility", option.value)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-gray-600" />
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Show Email Address
                    </div>
                    <div className="text-sm text-gray-500">
                      Allow others to see your email
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleSettingChange("showEmail", !settings.showEmail)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.showEmail ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.showEmail ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Show Phone Number
                    </div>
                    <div className="text-sm text-gray-500">
                      Allow others to see your phone number
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleSettingChange("showPhone", !settings.showPhone)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.showPhone ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.showPhone ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Messaging Preferences */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-gray-600" />
                Messaging
              </h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-3">
                  Choose who can send you messages
                </div>
                {[
                  {
                    value: "everyone",
                    label: "Everyone",
                    desc: "Anyone can message you",
                  },
                  {
                    value: "verified",
                    label: "Verified Users Only",
                    desc: "Only verified users can message you",
                  },
                  {
                    value: "none",
                    label: "No One",
                    desc: "Disable incoming messages",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="allowMessages"
                      value={option.value}
                      checked={settings.allowMessages === option.value}
                      onChange={() =>
                        handleSettingChange("allowMessages", option.value)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Activity Status */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-gray-600" />
                Activity Status
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Show Online Status
                  </div>
                  <div className="text-sm text-gray-500">
                    Let others see when you're online
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleSettingChange("showOnline", !settings.showOnline)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showOnline ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showOnline ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Data & Communications */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-gray-600" />
                Data & Communications
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Data Sharing for Analytics
                    </div>
                    <div className="text-sm text-gray-500">
                      Help improve our service with anonymous usage data
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleSettingChange("dataSharing", !settings.dataSharing)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.dataSharing ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.dataSharing ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Marketing Emails
                    </div>
                    <div className="text-sm text-gray-500">
                      Receive updates about new features and tips
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleSettingChange(
                        "marketingEmails",
                        !settings.marketingEmails
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.marketingEmails ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.marketingEmails
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Push Notifications
                    </div>
                    <div className="text-sm text-gray-500">
                      Get notified about messages and listings
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleSettingChange(
                        "pushNotifications",
                        !settings.pushNotifications
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.pushNotifications ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.pushNotifications
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Your Privacy Matters</p>
                  <p className="text-blue-700">
                    We respect your privacy and will never share your personal
                    information with third parties without your consent. Read
                    our{" "}
                    <button
                      className="underline hover:no-underline"
                      onClick={() => navigate("/privacy")}
                    >
                      Privacy Policy
                    </button>{" "}
                    to learn more.
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Saving Settings...</span>
                  </div>
                ) : (
                  <span>Save Privacy Settings</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettingsPage;
