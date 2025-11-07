import { useState, useRef } from "react";

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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("File size must be less than 5MB");
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
            accept="image/*"
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
        </div>

        {/* Error Message */}
        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

        {/* Description */}
        {description && <p className="text-sm text-gray-500">{description}</p>}

        {/* Current URL Display */}
        {value && <p className="text-xs text-gray-400 break-all">{value}</p>}
      </div>
    </div>
  );
}
