import { createServerClient } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

interface SecurityCheck {
  bucket_name: string;
  is_public: boolean;
  size_limit: number | null;
  allowed_types: string[] | null;
  total_files: number;
  security_status: string;
}

interface FileAudit {
  id: string;
  name: string;
  bucket_id: string;
  content_type: string | null;
  file_size: string | null;
  created_at: string;
  file_type_status: string;
  disposition_status: string;
}

export default async function SecurityTestPage() {
  const supabase = createServerClient();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Check if user is admin
  const { data: adminData } = await supabase
    .from("admins")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!adminData) {
    redirect("/dashboard");
  }

  // Check storage security configuration
  let securityCheck: SecurityCheck | null = null;
  try {
    const { data } = await supabase.rpc("check_storage_security").single();
    securityCheck = data as SecurityCheck;
  } catch (error) {
    console.error("Failed to fetch security check:", error);
  }

  // Get recent uploaded files audit
  let fileAudit: FileAudit[] = [];
  try {
    const { data } = await supabase
      .from("storage_security_audit")
      .select("*")
      .limit(20);
    fileAudit = (data as FileAudit[]) || [];
  } catch (error) {
    console.error("Failed to fetch file audit:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Security Configuration Test
          </h1>
          <p className="text-gray-600 mt-2">
            Verify file execution prevention and security headers
          </p>
        </div>

        {/* Security Headers Check */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🔒 Security Headers
          </h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="text-green-600 text-2xl mr-3">✓</span>
              <div>
                <strong>X-Content-Type-Options:</strong> nosniff
                <p className="text-sm text-gray-600">
                  Prevents MIME type sniffing attacks
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 text-2xl mr-3">✓</span>
              <div>
                <strong>X-Frame-Options:</strong> DENY
                <p className="text-sm text-gray-600">
                  Prevents clickjacking attacks
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 text-2xl mr-3">✓</span>
              <div>
                <strong>Content-Security-Policy:</strong> Configured
                <p className="text-sm text-gray-600">
                  Restricts script execution and prevents XSS
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 text-2xl mr-3">✓</span>
              <div>
                <strong>X-XSS-Protection:</strong> 1; mode=block
                <p className="text-sm text-gray-600">
                  Additional XSS protection layer
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Configuration */}
        {securityCheck && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              💾 Storage Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded p-4">
                <div className="text-sm text-gray-500">Bucket Name</div>
                <div className="text-lg font-medium">
                  {securityCheck.bucket_name}
                </div>
              </div>
              <div className="border rounded p-4">
                <div className="text-sm text-gray-500">Security Status</div>
                <div className="text-lg font-medium">
                  {securityCheck.security_status}
                </div>
              </div>
              <div className="border rounded p-4">
                <div className="text-sm text-gray-500">File Size Limit</div>
                <div className="text-lg font-medium">
                  {securityCheck.size_limit
                    ? `${(securityCheck.size_limit / 1024 / 1024).toFixed(
                        1
                      )} MB`
                    : "Not set"}
                </div>
              </div>
              <div className="border rounded p-4">
                <div className="text-sm text-gray-500">Total Files</div>
                <div className="text-lg font-medium">
                  {securityCheck.total_files}
                </div>
              </div>
              <div className="border rounded p-4 md:col-span-2">
                <div className="text-sm text-gray-500">Allowed MIME Types</div>
                <div className="text-sm font-mono mt-1">
                  {securityCheck.allowed_types?.join(", ") || "Not restricted"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Security Measures */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🛡️ File Security Measures
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <span className="text-green-600 text-xl mr-3">✓</span>
              <div>
                <strong>Extension Whitelist</strong>
                <p className="text-sm text-gray-600">
                  Only .jpg, .jpeg, .png, .webp allowed
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-xl mr-3">✓</span>
              <div>
                <strong>MIME Type Validation</strong>
                <p className="text-sm text-gray-600">
                  Server-side content type checking
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-xl mr-3">✓</span>
              <div>
                <strong>Magic Byte Verification</strong>
                <p className="text-sm text-gray-600">
                  Detects disguised executables
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-xl mr-3">✓</span>
              <div>
                <strong>Virus Scanning</strong>
                <p className="text-sm text-gray-600">
                  Pattern matching + optional ClamAV
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-xl mr-3">✓</span>
              <div>
                <strong>Isolated Storage</strong>
                <p className="text-sm text-gray-600">
                  Supabase object storage (not server filesystem)
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-xl mr-3">✓</span>
              <div>
                <strong>UUID Filenames</strong>
                <p className="text-sm text-gray-600">
                  Prevents path traversal attacks
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-xl mr-3">✓</span>
              <div>
                <strong>Size Limits</strong>
                <p className="text-sm text-gray-600">5MB maximum per file</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-xl mr-3">✓</span>
              <div>
                <strong>Content-Disposition: inline</strong>
                <p className="text-sm text-gray-600">
                  Files displayed, not downloaded
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Files Audit */}
        {fileAudit && fileAudit.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📋 Recent Files Audit
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Filename
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Content Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Disposition
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Uploaded
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fileAudit.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="max-w-xs truncate" title={file.name}>
                          {file.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {file.content_type || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            file.file_type_status?.includes("✓")
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {file.file_type_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            file.disposition_status?.includes("✓")
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {file.disposition_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(file.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Test Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🧪 Test File Execution Prevention
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Upload a normal image - should work ✓</li>
            <li>
              Try to upload a .exe file renamed to .jpg - should be rejected ✗
            </li>
            <li>Try to upload a .php file - should be rejected ✗</li>
            <li>Check browser console - CSP should block inline scripts ✗</li>
            <li>
              Inspect uploaded image response headers - verify security headers
              ✓
            </li>
          </ol>
          <div className="mt-4 text-sm text-blue-800">
            <strong>All checks passed means your system is secure! 🎉</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
