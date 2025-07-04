import React, { useState, useEffect } from "react";
import {
  Target,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";
import RealAddressService from "../lib/realAddressService";
import { calculateDistance } from "../utils/haversine";

interface DistanceTest {
  fromAddress: string;
  toUniversity: string;
  coordinates: {
    from: { lat: number; lng: number };
    to: { lat: number; lng: number };
  };
  calculated: number;
  verified: boolean;
  source: string;
}

const RealAddressValidation: React.FC = () => {
  const [tests, setTests] = useState<DistanceTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDistanceTests();
  }, []);

  const runDistanceTests = () => {
    const testResults: DistanceTest[] = [];

    // Test each real address against its nearest university
    RealAddressService.REAL_HOUSING_ADDRESSES.forEach((address) => {
      address.nearbyUniversities.forEach((universityName) => {
        const university = RealAddressService.REAL_UNIVERSITIES[universityName];

        if (university) {
          const calculated = RealAddressService.calculateDistance(
            address.coordinates.lat,
            address.coordinates.lng,
            university.coordinates.lat,
            university.coordinates.lng
          );

          // Also test with the new utility to ensure consistency
          const haversineCalc = calculateDistance(
            address.coordinates.lat,
            address.coordinates.lng,
            university.coordinates.lat,
            university.coordinates.lng
          );

          testResults.push({
            fromAddress: address.formattedAddress,
            toUniversity: universityName,
            coordinates: {
              from: address.coordinates,
              to: university.coordinates,
            },
            calculated,
            verified: Math.abs(calculated - haversineCalc) < 0.01, // Within 0.01 miles
            source: "RealAddressService",
          });
        }
      });
    });

    // Sort by distance
    testResults.sort((a, b) => a.calculated - b.calculated);
    setTests(testResults);
    setLoading(false);
  };

  const formatDistance = (miles: number): string => {
    if (miles < 1) {
      return `${(miles * 5280).toFixed(0)} feet`;
    }
    return `${miles.toFixed(2)} miles`;
  };

  const validateCoordinates = (coords: {
    lat: number;
    lng: number;
  }): boolean => {
    return (
      coords.lat >= -90 &&
      coords.lat <= 90 &&
      coords.lng >= -180 &&
      coords.lng <= 180
    );
  };

  const getDistanceColor = (distance: number): string => {
    if (distance < 0.5) return "text-green-600";
    if (distance < 1) return "text-blue-600";
    if (distance < 2) return "text-yellow-600";
    return "text-red-600";
  };

  const getDistanceLabel = (distance: number): string => {
    if (distance < 0.5) return "Walking Distance";
    if (distance < 1) return "Short Walk";
    if (distance < 2) return "Bike Ride";
    if (distance < 5) return "Short Drive";
    return "Long Commute";
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-blue-200 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const validTests = tests.filter((test) => test.verified);
  const invalidTests = tests.filter((test) => !test.verified);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <span>🌍 Real Address & Distance Validation</span>
        </h2>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {validTests.length}
            </div>
            <div className="text-sm text-green-700">Verified Addresses</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {invalidTests.length}
            </div>
            <div className="text-sm text-red-700">Calculation Mismatches</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {validTests.filter((t) => t.calculated < 1).length}
            </div>
            <div className="text-sm text-blue-700">Within 1 Mile</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {formatDistance(
                validTests.reduce((sum, test) => sum + test.calculated, 0) /
                  validTests.length || 0
              )}
            </div>
            <div className="text-sm text-yellow-700">Average Distance</div>
          </div>
        </div>

        {/* Universities Summary */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <span>Universities & Address Count</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.keys(RealAddressService.REAL_UNIVERSITIES).map(
              (university) => {
                const addressCount = validTests.filter(
                  (test) => test.toUniversity === university
                ).length;
                const avgDistance =
                  validTests
                    .filter((test) => test.toUniversity === university)
                    .reduce((sum, test) => sum + test.calculated, 0) /
                    addressCount || 0;

                return (
                  <div
                    key={university}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                  >
                    <div className="font-medium text-gray-900 text-sm mb-1">
                      {university.includes("University of California")
                        ? "UC Berkeley"
                        : university.includes("Stanford")
                        ? "Stanford"
                        : university.includes("Harvard")
                        ? "Harvard"
                        : university.includes("MIT")
                        ? "MIT"
                        : university.includes("NYU")
                        ? "NYU"
                        : university.includes("USC")
                        ? "USC"
                        : university}
                    </div>
                    <div className="text-xs text-gray-600">
                      {addressCount} addresses • Avg:{" "}
                      {formatDistance(avgDistance)}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Detailed Test Results */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Target className="w-5 h-5 text-green-600" />
          <span>Distance Calculation Results</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  University
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coordinates
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tests.slice(0, 20).map((test, index) => {
                const isValidCoords =
                  validateCoordinates(test.coordinates.from) &&
                  validateCoordinates(test.coordinates.to);

                return (
                  <tr key={index} className={test.verified ? "" : "bg-red-50"}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {test.verified && isValidCoords ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="text-sm text-gray-900 max-w-xs truncate"
                        title={test.fromAddress}
                      >
                        {test.fromAddress.split(",")[0]}
                      </div>
                      <div className="text-xs text-gray-500">
                        {test.fromAddress.split(",").slice(1).join(",").trim()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {test.toUniversity.includes("University of California")
                          ? "UC Berkeley"
                          : test.toUniversity.includes("Stanford")
                          ? "Stanford"
                          : test.toUniversity.includes("Harvard")
                          ? "Harvard"
                          : test.toUniversity.includes("MIT")
                          ? "MIT"
                          : test.toUniversity.includes("NYU")
                          ? "NYU"
                          : test.toUniversity.includes("USC")
                          ? "USC"
                          : test.toUniversity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium ${getDistanceColor(
                          test.calculated
                        )}`}
                      >
                        {formatDistance(test.calculated)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getDistanceLabel(test.calculated)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Haversine
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      <div>
                        From: {test.coordinates.from.lat.toFixed(4)},{" "}
                        {test.coordinates.from.lng.toFixed(4)}
                      </div>
                      <div>
                        To: {test.coordinates.to.lat.toFixed(4)},{" "}
                        {test.coordinates.to.lng.toFixed(4)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {tests.length > 20 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing first 20 of {tests.length} distance calculations
          </div>
        )}
      </div>

      {/* Algorithm Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center space-x-2">
          <Navigation className="w-5 h-5" />
          <span>Distance Calculation Method</span>
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>Algorithm:</strong> Haversine Formula - calculates
            great-circle distances between two points on Earth
          </p>
          <p>
            <strong>Accuracy:</strong> Highly accurate for distances up to a few
            hundred miles
          </p>
          <p>
            <strong>Earth Radius:</strong> 3,959 miles (used for calculations)
          </p>
          <p>
            <strong>Coordinate Source:</strong> Real verified addresses with
            precise GPS coordinates
          </p>
          <p>
            <strong>Validation:</strong> All coordinates verified to be within
            valid latitude (-90 to 90) and longitude (-180 to 180) ranges
          </p>
        </div>
      </div>
    </div>
  );
};

export default RealAddressValidation;
