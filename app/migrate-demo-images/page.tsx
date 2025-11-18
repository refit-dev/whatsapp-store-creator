"use client";

import { useState } from "react";

export default function MigrateDemoImagesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMigrate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/migrate-demo-images", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Migration failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Migrate Demo Store Images
          </h1>
          <p className="text-gray-600 mb-6">
            This will download Unsplash images and upload them to Supabase
            storage, then update the demo store products with the new URLs.
          </p>

          <button
            onClick={handleMigrate}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Migrating..." : "Start Migration"}
          </button>

          {loading && (
            <div className="mt-6">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">
                  Downloading and uploading images...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-900 font-semibold mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-green-900 font-semibold mb-4">
                ✅ Migration Complete!
              </h3>
              <p className="text-green-700 mb-4">{result.message}</p>

              <div className="space-y-4">
                {result.results.map((item: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded border ${
                      item.status === "success"
                        ? "bg-green-50 border-green-300"
                        : item.status === "error"
                        ? "bg-red-50 border-red-300"
                        : "bg-gray-50 border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.product}</span>
                      <span
                        className={`text-sm ${
                          item.status === "success"
                            ? "text-green-700"
                            : item.status === "error"
                            ? "text-red-700"
                            : "text-gray-600"
                        }`}
                      >
                        {item.status === "success"
                          ? `✓ ${item.images} images uploaded`
                          : item.status === "error"
                          ? `✗ ${item.error}`
                          : `⊘ ${item.reason}`}
                      </span>
                    </div>
                    {item.urls && (
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        {item.urls.map((url: string, i: number) => (
                          <div key={i} className="truncate">
                            {i + 1}. {url}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-blue-900 font-medium mb-2">Next Steps:</p>
                <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                  <li>Visit /demo-bakery to see the updated images</li>
                  <li>Test in incognito window to verify anonymous access</li>
                  <li>Images are now stored in Supabase storage bucket</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
