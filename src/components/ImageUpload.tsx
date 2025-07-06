import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle,
  Camera,
} from "lucide-react";
import { ImageUploadService } from "../lib/imageUpload";
import { useAuth } from "../contexts/AuthContext";
import { validateFileUpload } from "../lib/security";
import { errorHandler } from "../lib/errorHandler";

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
  disabled?: boolean;
  uploadType?: "listing" | "profile";
  onUploadStart?: () => void;
  onUploadComplete?: (urls: string[]) => void;
  onUploadError?: (error: string) => void;
  allowReordering?: boolean;
  compressionQuality?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  showPreview?: boolean;
  realTimeUpload?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  className = "",
  disabled = false,
  uploadType = "listing",
  onUploadStart,
  onUploadComplete,
  onUploadError,
  allowReordering = true,
  compressionQuality = 0.85,
  maxFileSize = 5,
  acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  showPreview = true,
  realTimeUpload = true,
}) => {
  const { isSupabaseReady } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [uploadStatus, setUploadStatus] = useState<{
    [key: string]: "uploading" | "success" | "error";
  }>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhanced file validation
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `Invalid file type. Accepted: ${acceptedTypes.join(", ")}`,
        };
      }

      // Check file size
      const maxSizeBytes = maxFileSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return {
          valid: false,
          error: `File too large. Maximum size: ${maxFileSize}MB`,
        };
      }

      // Additional security validation
      const securityValidation = validateFileUpload(file);
      if (!securityValidation.valid) {
        return {
          valid: false,
          error: securityValidation.error || "Security validation failed",
        };
      }

      return { valid: true };
    },
    [acceptedTypes, maxFileSize]
  );

  // Real-time image processing
  const processImageFile = useCallback(
    async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          try {
            // Calculate optimal dimensions
            const maxWidth = 1200;
            const maxHeight = 800;
            let { width, height } = img;

            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }

            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }

            canvas.width = width;
            canvas.height = height;

            if (ctx) {
              // Apply image processing
              ctx.drawImage(img, 0, 0, width, height);

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    const processedUrl = URL.createObjectURL(blob);
                    resolve(processedUrl);
                  } else {
                    reject(new Error("Failed to process image"));
                  }
                },
                "image/jpeg",
                compressionQuality
              );
            } else {
              reject(new Error("Failed to get canvas context"));
            }
          } catch (error) {
            reject(error);
          } finally {
            URL.revokeObjectURL(img.src);
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(img.src);
          reject(new Error("Failed to load image"));
        };

        img.src = URL.createObjectURL(file);
      });
    },
    [compressionQuality]
  );

  // Cleanup blob URLs when component unmounts or images change
  useEffect(() => {
    return () => {
      images.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [images]);

  // Real-time upload handler with enhanced features
  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;

      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) {
        const error = `Maximum ${maxImages} images allowed`;
        setUploadError(error);
        onUploadError?.(error);
        return;
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      // Call upload start callback
      onUploadStart?.();
      setUploading(true);
      setUploadError("");
      setUploadProgress({});
      setUploadStatus({});

      try {
        const newImageUrls: string[] = [];
        const successfulUploads: string[] = [];

        for (let i = 0; i < filesToProcess.length; i++) {
          const file = filesToProcess[i];
          const fileId = `${file.name}-${Date.now()}-${i}`;

          try {
            // Enhanced file validation
            const fileValidation = validateFile(file);
            if (!fileValidation.valid) {
              setUploadError(fileValidation.error || "Invalid file");
              setUploadStatus((prev) => ({ ...prev, [fileId]: "error" }));
              onUploadError?.(fileValidation.error || "Invalid file");
              continue;
            }

            setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));
            setUploadStatus((prev) => ({ ...prev, [fileId]: "uploading" }));

            // Real-time image processing
            const processedUrl = await processImageFile(file);
            setUploadProgress((prev) => ({ ...prev, [fileId]: 25 }));

            if (isSupabaseReady && realTimeUpload) {
              try {
                setUploadProgress((prev) => ({ ...prev, [fileId]: 50 }));

                // Upload to cloud storage
                if (uploadType === "listing") {
                  const listingId = `listing-${Date.now()}`;
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(file);
                  const fileList = dataTransfer.files;

                  const uploadResults =
                    await ImageUploadService.uploadListingImages(
                      fileList,
                      listingId
                    );

                  if (uploadResults?.[0]?.url) {
                    // Use cloud URL instead of local processed URL
                    URL.revokeObjectURL(processedUrl);
                    newImageUrls.push(uploadResults[0].url);
                    successfulUploads.push(uploadResults[0].url);
                  } else {
                    throw new Error(
                      "Cloud upload failed - using local preview"
                    );
                  }
                } else {
                  const userId = `user-${Date.now()}`;
                  const uploadResult =
                    await ImageUploadService.uploadProfileImage(file, userId);

                  if (uploadResult?.url) {
                    URL.revokeObjectURL(processedUrl);
                    newImageUrls.push(uploadResult.url);
                    successfulUploads.push(uploadResult.url);
                  } else {
                    throw new Error(
                      "Cloud upload failed - using local preview"
                    );
                  }
                }

                setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));
                setUploadStatus((prev) => ({ ...prev, [fileId]: "success" }));
              } catch (uploadError) {
                console.warn(
                  `Cloud upload failed for ${file.name}, using local preview:`,
                  uploadError
                );

                // Fallback to local processed image
                newImageUrls.push(processedUrl);
                setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));
                setUploadStatus((prev) => ({ ...prev, [fileId]: "success" }));

                errorHandler.logError(
                  new Error(`Upload fallback for ${file.name}: ${uploadError}`)
                );
              }
            } else {
              // Local mode - use processed image immediately
              setUploadProgress((prev) => ({ ...prev, [fileId]: 75 }));

              // Simulate processing time for better UX
              await new Promise((resolve) => setTimeout(resolve, 300));

              newImageUrls.push(processedUrl);
              setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));
              setUploadStatus((prev) => ({ ...prev, [fileId]: "success" }));
            }
          } catch (fileError) {
            console.error(`Error processing file ${file.name}:`, fileError);
            setUploadError(`Failed to process ${file.name}`);
            setUploadStatus((prev) => ({ ...prev, [fileId]: "error" }));
            onUploadError?.(`Failed to process ${file.name}`);
            errorHandler.logError(
              new Error(`File processing error: ${fileError}`)
            );
          }
        }

        if (newImageUrls.length > 0) {
          const updatedImages = [...images, ...newImageUrls];
          onImagesChange(updatedImages);
          onUploadComplete?.(successfulUploads);
        }
      } catch (error) {
        const errorMessage = "Failed to process images. Please try again.";
        setUploadError(errorMessage);
        onUploadError?.(errorMessage);
        errorHandler.logError(new Error(`Batch upload error: ${error}`));
      } finally {
        setUploading(false);
        // Clear progress after delay for better UX
        setTimeout(() => {
          setUploadProgress({});
          setUploadStatus({});
        }, 2000);
      }
    },
    [
      images,
      maxImages,
      disabled,
      isSupabaseReady,
      uploadType,
      onUploadStart,
      onUploadComplete,
      onUploadError,
      validateFile,
      processImageFile,
      realTimeUpload,
      onImagesChange,
    ]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeImage = useCallback(
    (index: number) => {
      const imageToRemove = images[index];

      // Revoke object URL to prevent memory leaks
      if (imageToRemove && imageToRemove.startsWith("blob:")) {
        URL.revokeObjectURL(imageToRemove);
      }

      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
      setUploadError("");
    },
    [images, onImagesChange]
  );

  // Image reordering functionality
  const handleImageDragStart = useCallback(
    (index: number) => {
      if (allowReordering && !disabled) {
        setDraggedIndex(index);
      }
    },
    [allowReordering, disabled]
  );

  const handleImageDragOver = useCallback(
    (e: React.DragEvent) => {
      if (allowReordering && !disabled && draggedIndex !== null) {
        e.preventDefault();
      }
    },
    [allowReordering, disabled, draggedIndex]
  );

  const handleImageDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();

      if (
        allowReordering &&
        !disabled &&
        draggedIndex !== null &&
        draggedIndex !== dropIndex
      ) {
        const newImages = [...images];
        const draggedImage = newImages[draggedIndex];

        // Remove dragged image
        newImages.splice(draggedIndex, 1);

        // Insert at new position
        newImages.splice(dropIndex, 0, draggedImage);

        onImagesChange(newImages);
      }

      setDraggedIndex(null);
    },
    [allowReordering, disabled, draggedIndex, images, onImagesChange]
  );

  const handleImageDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const canAddMore = images.length < maxImages && !disabled;
  const isProcessing = uploading || Object.keys(uploadProgress).length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Error */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-600 text-sm font-medium">Upload Error</p>
            <p className="text-red-600 text-sm">{uploadError}</p>
          </div>
        </div>
      )}

      {/* Enhanced Upload Progress with Status */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <p className="text-blue-600 text-sm font-medium">
              Processing {Object.keys(uploadProgress).length} image(s)...
            </p>
          </div>

          {Object.entries(uploadProgress).map(([fileId, progress]) => {
            const status = uploadStatus[fileId];
            const fileName = fileId.split("-")[0];

            return (
              <div key={fileId} className="mb-3 last:mb-0">
                <div className="flex justify-between items-center text-xs text-blue-600 mb-1">
                  <span className="truncate max-w-[200px]" title={fileName}>
                    {fileName}
                  </span>
                  <div className="flex items-center space-x-2">
                    {status === "success" && (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    )}
                    {status === "error" && (
                      <AlertCircle className="w-3 h-3 text-red-600" />
                    )}
                    <span>{progress}%</span>
                  </div>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      status === "success"
                        ? "bg-green-600"
                        : status === "error"
                        ? "bg-red-600"
                        : "bg-blue-600"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {status === "error" && (
                  <p className="text-red-600 text-xs mt-1">Processing failed</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced Image Grid with Reordering */}
      {images.length > 0 && showPreview && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className={`relative group ${
                allowReordering && !disabled ? "cursor-move" : ""
              } ${draggedIndex === index ? "opacity-50" : ""}`}
              draggable={allowReordering && !disabled}
              onDragStart={() => handleImageDragStart(index)}
              onDragOver={handleImageDragOver}
              onDrop={(e) => handleImageDrop(e, index)}
              onDragEnd={handleImageDragEnd}
            >
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-blue-300 transition-colors">
                <img
                  src={image}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg==";
                  }}
                  loading="lazy"
                />
              </div>

              {/* Image Controls */}
              {!disabled && (
                <>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:opacity-100 focus:ring-2 focus:ring-red-500 z-10"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {allowReordering && (
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      Drag to reorder
                    </div>
                  )}
                </>
              )}

              {/* Image Status Indicators */}
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium">
                  Cover
                </div>
              )}

              {realTimeUpload && image.startsWith("blob:") && (
                <div className="absolute bottom-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                  Local
                </div>
              )}

              {realTimeUpload &&
                !image.startsWith("blob:") &&
                !image.includes("data:") && (
                  <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    Uploaded
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Upload Area */}
      {canAddMore && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
            dragOver
              ? "border-blue-500 bg-blue-50 scale-105"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          } ${
            isProcessing ? "opacity-50 pointer-events-none" : "cursor-pointer"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label="Upload images"
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={uploadType === "listing"}
            accept={acceptedTypes.join(",")}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={isProcessing || disabled}
          />

          {isProcessing ? (
            <div className="flex flex-col items-center space-y-3">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  Processing images...
                </p>
                <p className="text-xs text-gray-500">
                  {realTimeUpload && isSupabaseReady
                    ? "Uploading to cloud storage"
                    : "Optimizing images locally"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  {dragOver ? (
                    <Upload className="w-8 h-8 text-blue-600" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                {uploadType === "profile" && (
                  <Camera className="w-5 h-5 text-blue-600 absolute -bottom-1 -right-1 bg-white rounded-full p-1" />
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 font-semibold focus:outline-none focus:underline transition-colors"
                  >
                    Click to upload
                  </button>
                  <span className="text-gray-500"> or drag and drop</span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-500">
                    {acceptedTypes
                      .map((type) => type.split("/")[1].toUpperCase())
                      .join(", ")}{" "}
                    up to {maxFileSize}MB
                  </p>
                  <p className="text-xs text-gray-400">
                    ({images.length}/{maxImages} images)
                  </p>
                </div>

                {realTimeUpload && (
                  <div className="flex items-center justify-center space-x-2 text-xs">
                    {isSupabaseReady ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Real-time cloud upload</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-yellow-600">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Local processing mode</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Images State */}
      {images.length === 0 && disabled && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mb-2">No images uploaded</p>
          <p className="text-xs text-gray-400">
            Image upload is currently disabled
          </p>
        </div>
      )}

      {/* Max Images Reached State */}
      {!canAddMore && images.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700 text-sm font-medium">
              Upload Complete
            </p>
          </div>
          <p className="text-green-600 text-xs">
            {images.length} of {maxImages} images uploaded successfully
          </p>
          {allowReordering && (
            <p className="text-green-600 text-xs mt-1">
              Drag images to reorder them
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(ImageUpload);
