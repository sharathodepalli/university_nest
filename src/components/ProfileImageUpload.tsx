import React, { useState, useRef, useEffect } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";

interface ProfileImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  userName: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImage,
  onImageChange,
  userName,
  disabled = false,
  size = "lg",
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup blob URLs when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (currentImage && currentImage.startsWith("blob:")) {
        URL.revokeObjectURL(currentImage);
      }
    };
  }, [currentImage]);

  // Reset image error when currentImage changes
  useEffect(() => {
    setImageError(false);
  }, [currentImage]);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;

    const file = files[0];

    // Validate file
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image too large. Maximum size is 5MB");
      return;
    }

    setUploading(true);
    try {
      // Import supabase here to avoid circular dependencies
      const { supabase } = await import("../lib/supabase");

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2);
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `profile-${timestamp}-${randomString}.${fileExt}`;

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from("profile-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        alert("Failed to upload image. Please try again.");
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        onImageChange(urlData.publicUrl);
      } else {
        throw new Error("Failed to get public URL");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={uploading || disabled}
      />

      <div
        className={`${sizeClasses[size]} relative group cursor-pointer`}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Profile Image Container */}
        <div
          className={`${
            sizeClasses[size]
          } bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center overflow-hidden ${
            dragOver ? "ring-2 ring-blue-500" : ""
          } ${uploading ? "opacity-50" : ""}`}
        >
          {currentImage && !imageError ? (
            <img
              src={currentImage}
              alt={userName}
              className="w-full h-full object-cover"
              onError={() => {
                console.warn("Failed to load profile image:", currentImage);
                setImageError(true);
              }}
              onLoad={() => setImageError(false)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Upload Overlay */}
        {!disabled && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <Loader2
                className={`${iconSizes[size]} text-white animate-spin`}
              />
            ) : (
              <Camera className={`${iconSizes[size]} text-white`} />
            )}
          </div>
        )}

        {/* Upload Button */}
        {!disabled && (
          <button
            type="button"
            className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Drag Overlay */}
      {dragOver && !disabled && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-full border-2 border-blue-500 border-dashed flex items-center justify-center">
          <Upload className={`${iconSizes[size]} text-blue-600`} />
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload;
