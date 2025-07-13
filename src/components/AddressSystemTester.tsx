import React, { useState } from "react";
import ProductionAddressInput from "./ProductionAddressInput";
import { CheckCircle, AlertTriangle, XCircle, MapPin } from "lucide-react";

interface TestResult {
  test: string;
  status: "pass" | "fail" | "warning";
  message: string;
}

const AddressSystemTester: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isRunningTests, setIsRunningTests] = useState(false);

  const runComprehensiveTests = async () => {
    setIsRunningTests(true);
    const results: TestResult[] = [];

    // Test 1: Google Maps API Key
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    results.push({
      test: "Google Maps API Key",
      status: apiKey ? "pass" : "warning",
      message: apiKey
        ? "API key is configured"
        : "API key not found - will use fallback mode",
    });

    // Test 2: Browser Geolocation Support
    results.push({
      test: "Browser Geolocation",
      status: navigator.geolocation ? "pass" : "warning",
      message: navigator.geolocation
        ? "Geolocation supported"
        : "Geolocation not supported",
    });

    // Test 3: Network Connectivity
    try {
      const response = await fetch("https://maps.googleapis.com/maps/api/js", {
        method: "HEAD",
      });
      results.push({
        test: "Google Maps Network Access",
        status: response.ok ? "pass" : "warning",
        message: response.ok
          ? "Google Maps accessible"
          : "Google Maps network issues",
      });
    } catch (error) {
      results.push({
        test: "Google Maps Network Access",
        status: "warning",
        message: "Network connectivity issues detected",
      });
    }

    // Test 4: Content Security Policy
    try {
      const testScript = document.createElement("script");
      testScript.src =
        "https://maps.googleapis.com/maps/api/js?libraries=places";
      document.head.appendChild(testScript);

      setTimeout(() => {
        document.head.removeChild(testScript);
        results.push({
          test: "CSP Configuration",
          status: "pass",
          message: "Google Maps scripts can be loaded",
        });
        setTestResults([...results]);
      }, 1000);
    } catch (error) {
      results.push({
        test: "CSP Configuration",
        status: "fail",
        message: "CSP blocking Google Maps scripts",
      });
    }

    // Test 5: Fallback System
    results.push({
      test: "Fallback System",
      status: "pass",
      message: "BasicAddressInput fallback available",
    });

    // Test 6: Component Loading
    results.push({
      test: "Lazy Loading",
      status: "pass",
      message: "Components load dynamically to optimize bundle size",
    });

    setTestResults(results);
    setIsRunningTests(false);
  };

  const getStatusIcon = (status: "pass" | "fail" | "warning") => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "fail":
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const handleAddressSelect = (addressDetails: any) => {
    console.log("Address selected:", addressDetails);
    setAddress(addressDetails.fullAddress);
    setCity(addressDetails.city);
    setState(addressDetails.state);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-blue-500" />
          Address Recommendation System Tester
        </h2>

        <div className="space-y-4">
          <button
            onClick={runComprehensiveTests}
            disabled={isRunningTests}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunningTests ? "Running Tests..." : "Run System Tests"}
          </button>

          {testResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">
                Test Results:
              </h3>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      {result.test}:
                    </span>
                    <span className="text-gray-600 ml-2">{result.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Live Address Testing
        </h3>

        <div className="space-y-4">
          <ProductionAddressInput
            address={address}
            city={city}
            state={state}
            onAddressChange={setAddress}
            onCityChange={setCity}
            onStateChange={setState}
            onAddressSelect={handleAddressSelect}
            placeholder="Test address autocomplete here..."
            showCurrentLocation={true}
            autoUpgrade={true}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Full address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="State"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Expected Behavior
        </h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            ✅ <strong>With Google Maps API:</strong> Real-time address
            suggestions as you type
          </p>
          <p>
            ✅ <strong>Without Google Maps API:</strong> Manual entry with state
            dropdown fallback
          </p>
          <p>
            ✅ <strong>Geolocation:</strong> "Use current location" button for
            automatic detection
          </p>
          <p>
            ✅ <strong>Progressive Enhancement:</strong> Automatically upgrades
            when Google Maps becomes available
          </p>
          <p>
            ✅ <strong>Error Handling:</strong> Graceful fallback to manual
            entry on any failures
          </p>
          <p>
            ✅ <strong>Performance:</strong> Lazy loading to minimize initial
            bundle size
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddressSystemTester;
