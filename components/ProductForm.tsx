"use client";
import { useState, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
  sanitizeText,
  sanitizeRichText,
  sanitizeNumber,
  sanitizeUrl,
} from "@/lib/sanitize";

interface ProductFormProps {
  storeId: string;
  currency: string;
  product?: {
    id: string;
    title: string;
    description: string | null;
    price_cents: number;
    image_urls: string[] | null;
    is_active: boolean;
    stock_qty: number | null;
  };
}

export function ProductForm({ storeId, currency, product }: ProductFormProps) {
  const sb = supabaseBrowser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(
    product ? (product.price_cents / 100).toString() : ""
  );
  const [stockQty, setStockQty] = useState(
    product?.stock_qty?.toString() || ""
  );
  const [imageUrl, setImageUrl] = useState(product?.image_urls?.[0] || "");
  const [videoUrl, setVideoUrl] = useState((product as any)?.video_url || "");
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [interactionType, setInteractionType] = useState<"buy_now" | "inquiry">(
    (product as any)?.interaction_type || "buy_now"
  );

  // Convert Google Drive viewing links to direct links
  const convertGoogleDriveLink = (url: string): string => {
    // Check if it's a Google Drive viewing link
    const driveMatch = url.match(
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/
    );
    if (driveMatch && driveMatch[1]) {
      // Convert to direct link format
      return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
    }
    return url;
  };

  // Upload image to Vercel Blob Storage
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      setMessage("Error: Image must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Error: Please upload an image file");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append("file", file);

      // Upload to Vercel Blob via our API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      setImageUrl(data.url);
      setMessage("✓ Image uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      if (error.message.includes("Blob storage not configured")) {
        setMessage(
          "⚠️ Image storage not configured. Please set up Vercel Blob in your environment variables."
        );
      } else {
        setMessage(`Error uploading image: ${error.message}`);
      }
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Sanitize all inputs
      const sanitizedTitle = sanitizeText(title).substring(0, 200);
      const sanitizedDescription = description
        ? sanitizeRichText(description).substring(0, 2000)
        : null;
      const sanitizedPrice = sanitizeNumber(parseFloat(price) * 100, {
        min: 0,
        integer: true,
      });
      const sanitizedStock = stockQty
        ? sanitizeNumber(parseInt(stockQty), { min: 0, integer: true })
        : null;

      // Validate required fields
      if (!sanitizedTitle) {
        setMessage("Product title is required");
        setLoading(false);
        return;
      }

      if (sanitizedPrice < 0) {
        setMessage("Product price cannot be negative");
        setLoading(false);
        return;
      }

      // Auto-convert and sanitize Google Drive links
      const finalImageUrl = imageUrl
        ? sanitizeUrl(convertGoogleDriveLink(imageUrl))
        : "";

      // Sanitize video URL if provided
      const finalVideoUrl = videoUrl ? sanitizeUrl(videoUrl) : null;

      const productData = {
        title: sanitizedTitle,
        description: sanitizedDescription,
        price_cents: sanitizedPrice,
        currency,
        image_urls: finalImageUrl ? [finalImageUrl] : null,
        video_url: finalVideoUrl,
        is_active: isActive,
        stock_qty: sanitizedStock,
        interaction_type: interactionType,
        store_id: storeId,
      };

      if (product) {
        // Update existing product
        const { error } = await sb
          .from("products")
          .update(productData)
          .eq("id", product.id);

        if (error) throw error;
        setMessage("Product updated successfully!");
      } else {
        // Create new product
        const { error } = await sb.from("products").insert(productData);

        if (error) throw error;
        setMessage("Product created successfully! Redirecting...");

        setTimeout(() => {
          window.location.href = "/dashboard/products";
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error saving product:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Product Name *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g., Chocolate Croissant"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe your product..."
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Price */}
      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Price ({currency}) *
        </label>
        <input
          id="price"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          placeholder="0.00"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Enter the price in {currency}
        </p>
      </div>

      {/* Stock Quantity */}
      <div>
        <label
          htmlFor="stock"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Stock Quantity
        </label>
        <input
          id="stock"
          type="number"
          min="0"
          value={stockQty}
          onChange={(e) => setStockQty(e.target.value)}
          placeholder="Leave empty for unlimited"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Leave empty for unlimited stock
        </p>
      </div>

      {/* Interaction Type */}
      <div>
        <label
          htmlFor="interaction_type"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Customer Action
        </label>
        <select
          id="interaction_type"
          value={interactionType}
          onChange={(e) =>
            setInteractionType(e.target.value as "buy_now" | "inquiry")
          }
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="buy_now">🛒 Buy Now - Add to cart & checkout</option>
          <option value="inquiry">
            💬 Express Interest - Submit inquiry form
          </option>
        </select>
        <p className="mt-1 text-sm text-gray-500">
          {interactionType === "buy_now"
            ? "Customers can immediately purchase this product"
            : "Customers fill a form to express interest (ideal for high-value items)"}
        </p>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Image (Optional)
        </label>

        {/* Image Preview */}
        {imageUrl && (
          <div className="mb-4">
            <img
              src={imageUrl}
              alt="Product preview"
              className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
            />
          </div>
        )}

        {/* Upload Options */}
        <div className="space-y-3">
          {/* Upload Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload Image
                </span>
              )}
            </button>
            <p className="mt-2 text-xs text-gray-500">
              JPG, PNG, WebP up to 5MB
            </p>
          </div>

          {/* OR Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-sm text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* URL Input */}
          <div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste image URL (optional)"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={uploading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Or paste a direct link to your image
            </p>
          </div>
        </div>
      </div>

      {/* Video URL */}
      <div>
        <label
          htmlFor="videoUrl"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Video Link (Optional)
        </label>
        <input
          id="videoUrl"
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="e.g., https://youtube.com/watch?v=... or https://vimeo.com/..."
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Add a YouTube, Vimeo, or direct video link to showcase your product
        </p>
      </div>

      {/* Active Status */}
      <div className="flex items-center gap-3">
        <input
          id="active"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="active" className="text-sm font-medium text-gray-700">
          Product is active and visible in store
        </label>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes("Error")
              ? "bg-red-50 text-red-800"
              : "bg-green-50 text-green-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Saving..."
            : product
            ? "Update Product"
            : "Create Product"}
        </button>
        <a
          href="/dashboard/products"
          className="px-8 py-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors text-center"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
