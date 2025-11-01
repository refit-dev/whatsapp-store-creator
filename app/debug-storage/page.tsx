"use client";

import { useState, useEffect } from "react";

export default function StorageSetupPage() {
  const [status, setStatus] = useState<string>("checking...");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStorageStatus = async () => {
    try {
      const response = await fetch("/api/setup-storage");
      const data = await response.json();

      if (response.ok) {
        setStatus(
          data.bucketExists ? "✅ Storage is ready!" : "❌ Storage needs setup"
        );
        setError(null);
      } else {
        setError(data.error);
        setStatus("❌ Error checking storage");
      }
    } catch (err) {
      setError("Failed to check storage status");
      setStatus("❌ Error");
    }
  };

  const setupStorage = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/setup-storage", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        setStatus("✅ Storage setup complete!");
        setError(null);
      } else {
        setError(data.error);
        setStatus("❌ Setup failed");
      }
    } catch (err) {
      setError("Failed to setup storage");
      setStatus("❌ Setup failed");
    } finally {
      setLoading(false);
    }
  };

  const testUpload = async () => {
    // Create a small test file
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px Arial";
      ctx.fillText("TEST", 25, 50);
    }

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append("file", blob, "test.png");
      formData.append("type", "logo");

      try {
        setLoading(true);
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();

        if (response.ok) {
          setStatus(`✅ Test upload successful! URL: ${data.url}`);
          setError(null);
        } else {
          setError(data.error);
          setStatus("❌ Test upload failed");
        }
      } catch (err) {
        setError("Failed to test upload");
        setStatus("❌ Test failed");
      } finally {
        setLoading(false);
      }
    }, "image/png");
  };

  // Check status on load
  useEffect(() => {
    checkStorageStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold mb-6">Storage Setup & Debug</h1>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Current Status</h2>
              <p className="text-gray-700 bg-gray-100 p-3 rounded">{status}</p>
              {error && (
                <p className="text-red-600 mt-2 p-3 bg-red-50 rounded">
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={checkStorageStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={loading}
              >
                Check Status
              </button>

              <button
                onClick={setupStorage}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={loading}
              >
                {loading ? "Setting up..." : "Setup Storage"}
              </button>

              <button
                onClick={testUpload}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? "Testing..." : "Test Upload"}
              </button>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-2">Instructions</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>First, click "Check Status" to see if storage is ready</li>
                <li>If storage needs setup, click "Setup Storage"</li>
                <li>
                  If automatic setup fails, follow the manual setup instructions
                  below
                </li>
                <li>Click "Test Upload" to verify uploads work</li>
                <li>
                  Go to{" "}
                  <a
                    href="/dashboard/store"
                    className="text-blue-600 underline"
                  >
                    Store Settings
                  </a>{" "}
                  to upload real images
                </li>
              </ol>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-2">
                Manual Setup (if automatic fails)
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm">
                <p className="font-medium mb-2">
                  If you get RLS policy errors, manually create the storage
                  bucket:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  <li>
                    Go to your{" "}
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Supabase Dashboard
                    </a>
                  </li>
                  <li>Navigate to Storage → Buckets</li>
                  <li>Click "New bucket"</li>
                  <li>
                    Name:{" "}
                    <code className="bg-gray-100 px-1 rounded">
                      store-images
                    </code>
                  </li>
                  <li>Set as Public: ✅ Yes</li>
                  <li>
                    File size limit:{" "}
                    <code className="bg-gray-100 px-1 rounded">5 MB</code>
                  </li>
                  <li>
                    Allowed MIME types:{" "}
                    <code className="bg-gray-100 px-1 rounded">
                      image/jpeg, image/png, image/webp, image/gif
                    </code>
                  </li>
                  <li>Click "Save"</li>
                  <li>Come back here and click "Test Upload"</li>
                </ol>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-2">Environment</h2>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <p>
                  <strong>Node ENV:</strong> {process.env.NODE_ENV || "unknown"}
                </p>
                <p>
                  <strong>Mock Images:</strong>{" "}
                  {process.env.USE_MOCK_IMAGES || "false"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
