import { supabase, isSupabaseConfigured } from "./supabase";

export interface UploadResult {
  url: string;
  path: string;
}

export class ImageUploadService {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  private static readonly LISTING_BUCKET = "listing-images";
  private static readonly PROFILE_BUCKET = "profile-images";

  static async uploadListingImages(
    files: FileList,
    listingId: string
  ): Promise<UploadResult[]> {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase not configured. Using local storage instead.");
    }

    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await this.uploadSingleImage(
          file,
          this.LISTING_BUCKET,
          `${listingId}/${Date.now()}-${i}`
        );
        results.push(result);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    return results;
  }

  static async uploadProfileImage(
    file: File,
    userId: string
  ): Promise<UploadResult> {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase not configured. Using local storage instead.");
    }

    return this.uploadSingleImage(
      file,
      this.PROFILE_BUCKET,
      `${userId}/profile-${Date.now()}`
    );
  }

  private static async uploadSingleImage(
    file: File,
    bucket: string,
    path: string
  ): Promise<UploadResult> {
    // Validate file
    this.validateFile(file);

    // Compress and resize image
    const processedFile = await this.processImage(file);

    // Generate unique filename
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${path}.${fileExt}`;

    try {
      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, processedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName);

      return {
        url: publicUrl,
        path: fileName,
      };
    } catch (error) {
      console.error("Supabase upload error:", error);
      throw error;
    }
  }

  private static validateFile(file: File): void {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        "Invalid file type. Please upload JPEG, PNG, or WebP images."
      );
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error("File too large. Please upload images smaller than 5MB.");
    }
  }

  private static async processImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        try {
          // Clean up the object URL
          URL.revokeObjectURL(img.src);

          // Calculate new dimensions (max 1200px width, maintain aspect ratio)
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

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const processedFile = new File([blob], file.name, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  });
                  resolve(processedFile);
                } else {
                  reject(new Error("Failed to process image"));
                }
              },
              "image/jpeg",
              0.85 // Quality
            );
          } else {
            reject(new Error("Failed to get canvas context"));
          }
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src); // Clean up the blob URL
        reject(new Error("Failed to load image"));
      };

      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
    });
  }

  static async deleteImage(bucket: string, path: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn(
        "Supabase not configured. Cannot delete image from storage."
      );
      return;
    }

    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        console.error("Failed to delete image:", error);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  }

  static async deleteListingImages(paths: string[]): Promise<void> {
    if (paths.length === 0) return;

    if (!isSupabaseConfigured()) {
      console.warn(
        "Supabase not configured. Cannot delete images from storage."
      );
      return;
    }

    try {
      const { error } = await supabase.storage
        .from(this.LISTING_BUCKET)
        .remove(paths);

      if (error) {
        console.error("Failed to delete listing images:", error);
      }
    } catch (error) {
      console.error("Error deleting listing images:", error);
    }
  }

  // Helper method to create a FileList from a single file
  static createFileList(file: File): FileList {
    const dt = new DataTransfer();
    dt.items.add(file);
    return dt.files;
  }
}
