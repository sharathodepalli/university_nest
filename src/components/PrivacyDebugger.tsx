import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePrivacy } from "../hooks/usePrivacy";
import {
  Shield,
  MessageCircle,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const PrivacyDebugger: React.FC = () => {
  const { user } = useAuth();
  const { settings } = usePrivacy();
  const [isVisible, setIsVisible] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === "development") {
      setIsVisible(true);
    }
  }, []);

  const runPrivacyTests = () => {
    if (!user) return;

    const tests = [
      {
        name: "Email Visibility",
        test: () => settings.showEmail,
        expected: "Should be OFF for privacy",
        result: settings.showEmail ? "VISIBLE" : "HIDDEN",
        status: !settings.showEmail ? "good" : "warning",
      },
      {
        name: "Phone Visibility",
        test: () => settings.showPhone,
        expected: "Should be OFF for privacy",
        result: settings.showPhone ? "VISIBLE" : "HIDDEN",
        status: !settings.showPhone ? "good" : "warning",
      },
      {
        name: "Message Permissions",
        test: () => settings.allowMessages,
        expected: "Should be 'verified' for privacy",
        result: settings.allowMessages,
        status:
          settings.allowMessages === "verified"
            ? "good"
            : settings.allowMessages === "none"
            ? "warning"
            : "error",
      },
    ];

    setTestResults(tests);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isVisible || !user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Privacy Debug</h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-1">
              <Mail className="w-3 h-3" />
              <span>Email: {settings.showEmail ? "ON" : "OFF"}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Phone className="w-3 h-3" />
              <span>Phone: {settings.showPhone ? "ON" : "OFF"}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <MessageCircle className="w-3 h-3" />
            <span>Messages: {settings.allowMessages}</span>
          </div>

          <div className="border-t pt-2">
            <p className="text-gray-600 mb-2">
              <strong>Remember:</strong> You always see your own contact info.
              Privacy affects what <em>others</em> see.
            </p>

            <button
              onClick={runPrivacyTests}
              className="w-full px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
            >
              Run Privacy Test
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="border-t pt-2 space-y-1">
              <h4 className="font-medium text-gray-700">Test Results:</h4>
              {testResults.map((test, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-600">{test.name}:</span>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(test.status)}
                    <span
                      className={`font-medium ${
                        test.status === "good"
                          ? "text-green-600"
                          : test.status === "warning"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {test.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-2 text-gray-500">
            <p>💡 To test privacy: use incognito browser as different user</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyDebugger;
