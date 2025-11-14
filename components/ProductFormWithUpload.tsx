"use client";
import { useState, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

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

export function ProductFormWithUpload({
  storeId,
  currency,
  product,
}: ProductFormProps) {
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
  const [imageUrls, setImageUrls] = useState<string[]>(
    product?.image_urls || []
  );
  const [isActive, setIsActive] = useState(product?.is_active ?? true);

  // Upload image to Vercel Blob Storage
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    setUploading(true);
    setMessage("");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name}: Image must be less than 5MB`);
        continue;
      }

      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name}: Must be an image file`);
        continue;
      }

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
        uploadedUrls.push(data.url);
      } catch (error: any) {
        console.error("Upload error:", error);
        if (error.message.includes("Blob storage not configured")) {
          errors.push(
            "Image storage not configured. Please set up Vercel Blob."
          );
          break;
        } else {
          errors.push(`${file.name}: ${error.message}`);
        }
      }
    }

    if (uploadedUrls.length > 0) {
      setImageUrls([...imageUrls, ...uploadedUrls]);
      setMessage(
        `✓ ${uploadedUrls.length} image${
          uploadedUrls.length !== 1 ? "s" : ""
        } uploaded successfully!`
      );
    }

    if (errors.length > 0) {
      setMessage((prev) =>
        prev
          ? `${prev}\n⚠️ Errors: ${errors.join(", ")}`
          : `⚠️ Errors: ${errors.join(", ")}`
      );
    }

    setUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImageUrls(imageUrls.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const productData = {
        title,
        description: description || null,
        price_cents: Math.round(parseFloat(price) * 100),
        currency,
        image_urls: imageUrls,
        is_active: isActive,
        stock_qty: stockQty ? parseInt(stockQty) : null,
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

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Images {imageUrls.length > 0 && `(${imageUrls.length})`}
        </label>

        {/* Image Previews */}
        {imageUrls.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Product ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                  {index === 0 && (
                    <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Main
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              First image will be the main product image. Drag to reorder
              (coming soon).
            </p>
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
              multiple
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
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
                  {imageUrls.length > 0 ? "Add More Images" : "Upload Images"}
                </span>
              )}
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Select multiple images (JPG, PNG, WebP up to 5MB each)
            </p>
          </div>
        </div>
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
              : message.includes("✓")
              ? "bg-green-50 text-green-800"
              : "bg-blue-50 text-blue-800"
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
