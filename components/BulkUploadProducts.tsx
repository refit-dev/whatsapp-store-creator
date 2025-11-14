"use client";
import { useState, useRef } from "react";

interface BulkUploadProductsProps {
  storeId: string;
  currency: string;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

interface ValidationResult {
  valid: number;
  invalid: number;
  errors: Array<{ row: number; error: string }>;
  warnings: Array<{ row: number; warning: string }>;
}

export function BulkUploadProducts({
  storeId,
  currency,
}: BulkUploadProductsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "instructions">(
    "upload"
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (
      !validTypes.includes(selectedFile.type) &&
      !selectedFile.name.endsWith(".csv")
    ) {
      setError("Please upload a CSV or Excel file");
      return;
    }

    // Validate file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);
    setError("");
    setResult(null);
    setValidation(null);

    // Auto-validate after file selection
    validateFile(selectedFile);
  };

  const validateFile = async (selectedFile: File) => {
    setValidating(true);
    setError("");
    setValidation(null);

    try {
      const text = await selectedFile.text();
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        setError("File is empty or has no data rows");
        setValidating(false);
        return;
      }

      // Parse CSV header
      const header = lines[0].split(",").map((h) => h.trim());

      // Check required columns
      const requiredColumns = ["Product Name", "Price"];
      const missingColumns = requiredColumns.filter(
        (col) => !header.includes(col)
      );

      if (missingColumns.length > 0) {
        setError(`Missing required columns: ${missingColumns.join(", ")}`);
        setValidating(false);
        return;
      }

      // Validate each row
      const errors: Array<{ row: number; error: string }> = [];
      const warnings: Array<{ row: number; warning: string }> = [];
      let validCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        try {
          const values = line.split(",").map((v) => v.trim());
          const row: any = {};

          header.forEach((col, idx) => {
            row[col] = values[idx] || "";
          });

          // Validate required fields
          if (!row["Product Name"]) {
            errors.push({ row: i + 1, error: "Product Name is required" });
            continue;
          }

          if (!row["Price"] || isNaN(parseFloat(row["Price"]))) {
            errors.push({ row: i + 1, error: "Invalid or missing price" });
            continue;
          }

          // Check for warnings
          if (!row["Description"]) {
            warnings.push({
              row: i + 1,
              warning: "No description provided",
            });
          }

          if (!row["Image URL"]) {
            warnings.push({
              row: i + 1,
              warning: "No image URL provided",
            });
          }

          validCount++;
        } catch (err: any) {
          errors.push({ row: i + 1, error: err.message || "Parse error" });
        }
      }

      setValidation({
        valid: validCount,
        invalid: errors.length,
        errors,
        warnings,
      });
    } catch (err: any) {
      setError(err.message || "Failed to validate file");
    } finally {
      setValidating(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("storeId", storeId);
      formData.append("currency", currency);

      const response = await fetch("/api/products/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setResult(data);

      // If all products uploaded successfully, close modal after delay and refresh
      if (data.failed === 0 && data.success > 0) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err: any) {
      console.error("Bulk upload error:", err);
      setError(err.message || "Failed to upload products");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Download the CSV template
    const link = document.createElement("a");
    link.href = "/product-bulk-upload-template.csv";
    link.download = "product-bulk-upload-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        <span>📤</span>
        Bulk Upload
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="border-b border-gray-200">
              <div className="flex items-center justify-between p-6 pb-0">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    📦 Bulk Upload Products
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload multiple products at once using CSV or Excel
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-6 mt-4">
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                    activeTab === "upload"
                      ? "bg-white text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Upload
                </button>
                <button
                  onClick={() => setActiveTab("instructions")}
                  className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                    activeTab === "instructions"
                      ? "bg-white text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  📖 Instructions
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Upload Tab */}
              {activeTab === "upload" && (
                <>
                  {/* Download Template Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">ℹ️</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-2">
                          Step 1: Download Template
                        </h3>
                        <p className="text-sm text-blue-800 mb-3">
                          Download our CSV template, fill in your product
                          details, and upload it back.
                        </p>
                        <button
                          onClick={handleDownloadTemplate}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <span>⬇️</span>
                          Download Template
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Template Format Guide */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Template Format:
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>
                        <strong>Product Name</strong> (Required) - Name of your
                        product
                      </li>
                      <li>
                        <strong>Description</strong> (Optional) - Product
                        description
                      </li>
                      <li>
                        <strong>Price</strong> (Required) - Price in {currency}{" "}
                        (e.g., 9.99)
                      </li>
                      <li>
                        <strong>Stock Quantity</strong> (Optional) - Available
                        stock count
                      </li>
                      <li>
                        <strong>Image URL</strong> (Optional) - Direct link to
                        product image. You can use Google Drive links (make sure
                        they&apos;re public), Imgur, ImgBB, or any publicly
                        accessible image link
                      </li>
                      <li>
                        <strong>Active Status</strong> (Optional) - TRUE or
                        FALSE (default: TRUE)
                      </li>
                    </ul>
                  </div>

                  {/* File Upload Section */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📁</div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Step 2: Upload Your File
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        CSV or Excel file (max 5MB)
                      </p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                      >
                        <span>📤</span>
                        Select File
                      </button>

                      {file && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                          <span>✅</span>
                          <span className="text-sm text-green-800 font-medium">
                            {file.name}
                          </span>
                          <button
                            onClick={() => {
                              setFile(null);
                              setValidation(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                              }
                            }}
                            className="text-green-600 hover:text-green-800 text-xl leading-none"
                          >
                            ×
                          </button>
                        </div>
                      )}

                      {validating && (
                        <div className="mt-4 text-sm text-gray-600">
                          <span className="inline-block animate-spin mr-2">
                            🔄
                          </span>
                          Validating file...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Validation Results */}
                  {validation && !validating && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <span className="text-3xl">✓</span>
                        <div className="flex-1">
                          <h3 className="font-bold text-blue-900 text-lg mb-1">
                            Validation Complete
                          </h3>
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div className="bg-white rounded-lg p-3 border border-green-200">
                              <div className="text-2xl font-bold text-green-600">
                                {validation.valid}
                              </div>
                              <div className="text-sm text-gray-600">
                                Valid Products
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-red-200">
                              <div className="text-2xl font-bold text-red-600">
                                {validation.invalid}
                              </div>
                              <div className="text-sm text-gray-600">
                                Invalid Rows
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Validation Errors */}
                      {validation.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                          <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                            <span>❌</span>
                            {validation.errors.length} Error
                            {validation.errors.length !== 1 ? "s" : ""} Found
                          </h4>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {validation.errors.map((err, idx) => (
                              <p key={idx} className="text-sm text-red-800">
                                Row {err.row}: {err.error}
                              </p>
                            ))}
                          </div>
                          <p className="text-xs text-red-700 mt-2">
                            ⚠️ Please fix these errors before uploading
                          </p>
                        </div>
                      )}

                      {/* Validation Warnings */}
                      {validation.warnings.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                            <span>⚠️</span>
                            {validation.warnings.length} Warning
                            {validation.warnings.length !== 1 ? "s" : ""}
                          </h4>
                          <div className="max-h-24 overflow-y-auto space-y-1">
                            {validation.warnings
                              .slice(0, 5)
                              .map((warn, idx) => (
                                <p
                                  key={idx}
                                  className="text-sm text-yellow-800"
                                >
                                  Row {warn.row}: {warn.warning}
                                </p>
                              ))}
                            {validation.warnings.length > 5 && (
                              <p className="text-xs text-yellow-700 italic">
                                ...and {validation.warnings.length - 5} more
                                warnings
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-yellow-700 mt-2">
                            ℹ️ You can still upload, but consider adding missing
                            information
                          </p>
                        </div>
                      )}

                      {/* Ready to Upload Message */}
                      {validation.valid > 0 && validation.invalid === 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                          <p className="text-sm text-green-800 font-medium text-center">
                            ✅ Ready to upload {validation.valid} product
                            {validation.valid !== 1 ? "s" : ""}!
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900 mb-1">
                            Upload Error
                          </h4>
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Success/Error Results */}
                  {result && (
                    <div className="space-y-3">
                      {/* Success Summary */}
                      {result.success > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">✅</span>
                            <div>
                              <h4 className="font-semibold text-green-900">
                                Successfully uploaded {result.success} product
                                {result.success !== 1 ? "s" : ""}
                              </h4>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Error Details */}
                      {result.failed > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">❌</span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-red-900 mb-2">
                                {result.failed} product
                                {result.failed !== 1 ? "s" : ""} failed to
                                upload
                              </h4>
                              <div className="max-h-32 overflow-y-auto space-y-1">
                                {result.errors.map((err, idx) => (
                                  <p key={idx} className="text-sm text-red-800">
                                    Row {err.row}: {err.error}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Instructions Tab */}
              {activeTab === "instructions" && (
                <div className="space-y-6">
                  {/* Overview */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
                    <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <span>📖</span>
                      How to Bulk Upload Products
                    </h3>
                    <p className="text-sm text-blue-800">
                      Follow these simple steps to upload multiple products at
                      once using a CSV file.
                    </p>
                  </div>

                  {/* Step by Step Instructions */}
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          1
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Download the Template
                          </h4>
                          <p className="text-sm text-gray-700 mb-3">
                            Click the &quot;Download Template&quot; button to
                            get a sample CSV file with the correct format.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          2
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Fill in Your Products
                          </h4>
                          <p className="text-sm text-gray-700 mb-3">
                            Open the CSV file in Excel or Google Sheets and add
                            your products:
                          </p>
                          <div className="bg-white border border-gray-200 rounded p-3 space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <span className="text-green-600 font-bold">
                                ✓
                              </span>
                              <div>
                                <strong>Product Name</strong> (Required) - The
                                name of your product
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-green-600 font-bold">
                                ✓
                              </span>
                              <div>
                                <strong>Price</strong> (Required) - Price in{" "}
                                {currency} (e.g., 9.99)
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-gray-400">○</span>
                              <div>
                                <strong>Description</strong> (Optional) -
                                Product details
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-gray-400">○</span>
                              <div>
                                <strong>Stock Quantity</strong> (Optional) -
                                Available stock count
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-gray-400">○</span>
                              <div>
                                <strong>Image URL</strong> (Optional) - See
                                image instructions below
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-gray-400">○</span>
                              <div>
                                <strong>Active Status</strong> (Optional) - TRUE
                                or FALSE (default: TRUE)
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 - Image URLs */}
                    <div className="border-2 border-amber-200 bg-amber-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold">
                          📷
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-amber-900 mb-2">
                            Adding Product Images
                          </h4>
                          <p className="text-sm text-amber-800 mb-3">
                            You can use image links from various sources:
                          </p>
                          <ul className="space-y-2 text-sm text-amber-900">
                            <li className="flex items-start gap-2">
                              <span>•</span>
                              <div>
                                <strong>Google Drive:</strong> Upload image to
                                Drive, right-click → Share → &quot;Anyone with
                                the link&quot; → Copy link. Make sure it&apos;s
                                set to PUBLIC!
                              </div>
                            </li>
                            <li className="flex items-start gap-2">
                              <span>•</span>
                              <div>
                                <strong>Imgur / ImgBB:</strong> Free image
                                hosting sites that give you direct links
                                automatically
                              </div>
                            </li>
                            <li className="flex items-start gap-2">
                              <span>•</span>
                              <div>
                                <strong>Any public URL:</strong> Any image link
                                that&apos;s publicly accessible will work
                              </div>
                            </li>
                          </ul>
                          <div className="mt-3 p-2 bg-amber-100 rounded border border-amber-300">
                            <p className="text-xs text-amber-900 font-medium">
                              ⚠️ Important: Make sure your image links are
                              PUBLIC and accessible to anyone!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          3
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Save as CSV
                          </h4>
                          <p className="text-sm text-gray-700">
                            Save your file as CSV (Comma Separated Values)
                            format. In Excel: File → Save As → Choose &quot;CSV
                            (Comma delimited)&quot;
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          4
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Upload & Validate
                          </h4>
                          <p className="text-sm text-gray-700 mb-2">
                            Go back to the &quot;Upload&quot; tab, click
                            &quot;Select File&quot;, and choose your CSV file.
                          </p>
                          <p className="text-sm text-gray-700">
                            The system will automatically validate your file and
                            show you any errors before uploading.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 6 */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                          ✓
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Review & Upload
                          </h4>
                          <p className="text-sm text-gray-700">
                            If validation passes, click &quot;Upload
                            Products&quot; and your products will be added to
                            your store!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <span>💡</span>
                      Pro Tips
                    </h4>
                    <ul className="space-y-1 text-sm text-green-800">
                      <li>• You can upload up to 100+ products at once</li>
                      <li>• Leave optional fields empty if not needed</li>
                      <li>
                        • Use TRUE/FALSE for Active Status (products are active
                        by default)
                      </li>
                      <li>• File must be under 5MB</li>
                      <li>
                        • The validation will show you exactly which rows have
                        errors
                      </li>
                    </ul>
                  </div>

                  {/* Quick Action */}
                  <div className="text-center pt-4">
                    <button
                      onClick={() => setActiveTab("upload")}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <span>←</span>
                      Go to Upload Tab
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                disabled={uploading}
                className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={
                  !file ||
                  uploading ||
                  validating ||
                  (validation !== null && validation.invalid > 0)
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading
                  ? "Uploading..."
                  : validating
                  ? "Validating..."
                  : validation && validation.invalid > 0
                  ? "Fix Errors to Upload"
                  : "Upload Products"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
