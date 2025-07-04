import React, { useState } from "react";
import ImageUpload from "../components/ImageUpload";

const ImageUploadExample: React.FC = () => {
  const [listingImages, setListingImages] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string[]>([]);

  const handleListingUploadStart = () => {
    console.log("🚀 Listing upload started");
  };

  const handleListingUploadComplete = (urls: string[]) => {
    console.log("✅ Listing upload completed:", urls);
  };

  const handleListingUploadError = (error: string) => {
    console.error("❌ Listing upload error:", error);
  };

  const handleProfileUploadComplete = (urls: string[]) => {
    console.log("✅ Profile upload completed:", urls);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">
        Enhanced ImageUpload Component
      </h1>

      {/* Listing Images Example */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Listing Images (Real-time Upload)
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <ImageUpload
            images={listingImages}
            onImagesChange={setListingImages}
            uploadType="listing"
            maxImages={10}
            onUploadStart={handleListingUploadStart}
            onUploadComplete={handleListingUploadComplete}
            onUploadError={handleListingUploadError}
            allowReordering={true}
            compressionQuality={0.8}
            maxFileSize={10}
            realTimeUpload={true}
            acceptedTypes={["image/jpeg", "image/png", "image/webp"]}
          />
        </div>
      </div>

      {/* Profile Image Example */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Profile Image (Single Upload)
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <ImageUpload
            images={profileImage}
            onImagesChange={setProfileImage}
            uploadType="profile"
            maxImages={1}
            onUploadComplete={handleProfileUploadComplete}
            allowReordering={false}
            compressionQuality={0.9}
            maxFileSize={5}
            realTimeUpload={true}
            className="max-w-md mx-auto"
          />
        </div>
      </div>

      {/* Local Processing Example */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Local Processing (No Cloud Upload)
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <ImageUpload
            images={[]}
            onImagesChange={() => {}}
            uploadType="listing"
            maxImages={5}
            realTimeUpload={false}
            compressionQuality={0.7}
            showPreview={true}
          />
        </div>
      </div>

      {/* Debug Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Debug Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Listing Images:</strong>
            <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
              {JSON.stringify(listingImages, null, 2)}
            </pre>
          </div>
          <div>
            <strong>Profile Image:</strong>
            <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
              {JSON.stringify(profileImage, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-800 mb-4">
          🚀 Enhanced Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <ul className="space-y-2">
            <li>✅ Real-time cloud upload</li>
            <li>✅ Image compression & optimization</li>
            <li>✅ Drag & drop reordering</li>
            <li>✅ Progress tracking</li>
            <li>✅ Error handling & recovery</li>
            <li>✅ File validation</li>
          </ul>
          <ul className="space-y-2">
            <li>✅ Multiple upload modes</li>
            <li>✅ Accessibility support</li>
            <li>✅ Memory leak prevention</li>
            <li>✅ Status indicators</li>
            <li>✅ Customizable settings</li>
            <li>✅ Fallback mechanisms</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadExample;
