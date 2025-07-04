import React, { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import ImageUpload from "../components/ImageUpload";

const RealTimeTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");
  const [images, setImages] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic connection
        const isConfigured = isSupabaseConfigured();
        addTestResult(`✅ Supabase configured: ${isConfigured}`);

        if (isConfigured) {
          // Test database connection
          const { error } = await supabase
            .from("profiles")
            .select("count")
            .limit(1);
          if (error) {
            addTestResult(`❌ Database connection failed: ${error.message}`);
            setConnectionStatus("disconnected");
          } else {
            addTestResult("✅ Database connection successful");

            // Test storage connection
            const { data: buckets, error: bucketError } =
              await supabase.storage.listBuckets();
            if (bucketError) {
              addTestResult(
                `❌ Storage connection failed: ${bucketError.message}`
              );
            } else {
              addTestResult(
                `✅ Storage connection successful. Buckets: ${buckets
                  .map((b) => b.name)
                  .join(", ")}`
              );
              setConnectionStatus("connected");
            }
          }
        } else {
          addTestResult(
            "❌ Supabase not configured - running in development mode"
          );
          setConnectionStatus("disconnected");
        }
      } catch (error) {
        addTestResult(`❌ Connection test failed: ${error}`);
        setConnectionStatus("disconnected");
      }
    };

    testConnection();
  }, []);

  const addTestResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  const handleUploadComplete = (urls: string[]) => {
    addTestResult(`✅ Upload completed: ${urls.length} images uploaded`);
    urls.forEach((url, index) => {
      addTestResult(`   📷 Image ${index + 1}: ${url.substring(0, 50)}...`);
    });
  };

  const handleUploadError = (error: string) => {
    addTestResult(`❌ Upload error: ${error}`);
  };

  const handleUploadStart = () => {
    addTestResult("🚀 Upload started...");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🚀 Real-Time Mode Test Dashboard
        </h1>

        {/* Connection Status */}
        <div className="mb-6">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              connectionStatus === "connected"
                ? "bg-green-100 text-green-800"
                : connectionStatus === "disconnected"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {connectionStatus === "connected" && "🟢 Real-Time Mode Active"}
            {connectionStatus === "disconnected" && "🔴 Development Mode"}
            {connectionStatus === "checking" && "🟡 Checking Connection..."}
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Connection Test Results:
          </h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono text-gray-700">
                {result}
              </div>
            ))}
          </div>
        </div>

        {/* Image Upload Test */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Test Real-Time Image Upload:
          </h3>

          <ImageUpload
            images={images}
            onImagesChange={setImages}
            uploadType="listing"
            maxImages={5}
            realTimeUpload={true}
            onUploadStart={handleUploadStart}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            className="border-2 border-blue-200 rounded-lg p-4"
          />
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">
            How to Enable Real-Time Mode:
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
            <li>Run the SQL setup script in your Supabase SQL Editor</li>
            <li>Ensure your .env file has valid Supabase credentials</li>
            <li>Restart the development server</li>
            <li>
              Test image upload above - it should show "Real-Time Mode Active"
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RealTimeTest;
