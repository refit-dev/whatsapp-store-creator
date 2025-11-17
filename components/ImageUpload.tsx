import { useState, useRef } from "react";
import {
  validateFile,
  formatFileSize,
  ALLOWED_EXTENSIONS,
} from "@/lib/file-validation";

export interface ImageUploadProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  placeholder?: string;
  description?: string;
  aspectRatio?: "square" | "banner";
  imageType?: "logo" | "banner" | "product";
}

export function ImageUpload({
  label,
  value,
  onChange,
  placeholder = "No image selected",
  description,
  aspectRatio = "square",
  imageType = "product",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file using comprehensive validation
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || "Invalid file");
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", imageType);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      onChange(data.url);
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadError(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const previewClassName =
    aspectRatio === "banner"
      ? "w-full h-32 object-cover rounded-lg"
      : imageType === "logo"
      ? "w-24 h-24 object-cover rounded-full border-2 border-gray-200 shadow-sm"
      : "w-24 h-24 object-cover rounded-lg";

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="space-y-4">
        {/* Current Image Preview */}
        {value && (
          <div className="relative inline-block">
            <img src={value} alt={label} className={previewClassName} />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              ×
            </button>
          </div>
        )}

        {/* Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={triggerFileSelect}
            disabled={uploading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading
              ? "Uploading..."
              : value
              ? "Change Image"
              : "Upload Image"}
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Allowed: JPG, PNG, WebP (Max 5MB)
          </p>
        </div>

        {/* Error Message */}
        {uploadError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{uploadError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {description && <p className="text-sm text-gray-500">{description}</p>}

        {/* Current URL Display */}
        {value && <p className="text-xs text-gray-400 break-all">{value}</p>}
      </div>
    </div>
  );
}
