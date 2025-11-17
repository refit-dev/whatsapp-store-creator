import { createServerClient } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

interface VirusScan {
  id: string;
  user_id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  scanner: string;
  infected: boolean;
  threats: string[] | null;
  scan_time_ms: number;
  created_at: string;
  store_name?: string;
  handle?: string;
}

interface ScanStats {
  total_threats_detected: number;
  total_clean_scans: number;
  users_with_threats: number;
  total_scans: number;
  threat_percentage: number;
  scanner: string;
  scan_date: string;
}

export default async function VirusScansPage() {
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

  // Get recent threats
  const { data: recentThreats, error: threatsError } = await supabase
    .from("recent_threats")
    .select("*")
    .limit(50);

  // Get scan statistics
  const { data: scanStats, error: statsError } = await supabase
    .from("virus_scan_stats")
    .select("*")
    .order("scan_date", { ascending: false })
    .limit(30);

  // Get overall statistics
  const { data: overallStats } = await supabase
    .from("virus_scans")
    .select("infected, scanner", { count: "exact" });

  const totalScans = overallStats?.length || 0;
  const infectedScans = overallStats?.filter((s) => s.infected).length || 0;
  const cleanScans = totalScans - infectedScans;
  const threatPercentage =
    totalScans > 0 ? ((infectedScans / totalScans) * 100).toFixed(2) : 0;

  // Count by scanner
  const scannerCounts =
    overallStats?.reduce((acc, scan) => {
      acc[scan.scanner] = (acc[scan.scanner] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Virus Scan Monitoring
          </h1>
          <p className="text-gray-600 mt-2">
            Security monitoring and threat detection analytics
          </p>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Scans</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {totalScans.toLocaleString()}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Clean Files</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {cleanScans.toLocaleString()}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">
              Threats Detected
            </div>
            <div className="mt-2 text-3xl font-bold text-red-600">
              {infectedScans.toLocaleString()}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Threat Rate</div>
            <div className="mt-2 text-3xl font-bold text-orange-600">
              {threatPercentage}%
            </div>
          </div>
        </div>

        {/* Scanner Usage */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Scanner Usage
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(scannerCounts).map(([scanner, count]) => (
              <div key={scanner} className="border rounded p-4">
                <div className="text-sm text-gray-500 capitalize">
                  {scanner}
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {count.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {totalScans > 0 ? ((count / totalScans) * 100).toFixed(1) : 0}
                  % of total
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Threats */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Threats</h2>
            <p className="text-sm text-gray-600 mt-1">
              Files blocked by virus/malware scanning
            </p>
          </div>

          {threatsError && (
            <div className="p-6 bg-red-50 text-red-700">
              Error loading threats: {threatsError.message}
            </div>
          )}

          {!recentThreats || recentThreats.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">🛡️</div>
              <p className="font-medium">No threats detected</p>
              <p className="text-sm mt-1">All uploaded files are clean</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filename
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scanner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Threats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scan Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentThreats.map((threat: VirusScan) => (
                    <tr key={threat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(threat.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {threat.store_name ? (
                          <Link
                            href={`/${threat.handle}`}
                            className="text-blue-600 hover:text-blue-700"
                            target="_blank"
                          >
                            {threat.store_name}
                          </Link>
                        ) : (
                          <span className="text-gray-400">No store</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div
                          className="max-w-xs truncate"
                          title={threat.filename}
                        >
                          {threat.filename}
                        </div>
                        <div className="text-xs text-gray-500">
                          {threat.mime_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(threat.file_size / 1024).toFixed(1)} KB
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            threat.scanner === "clamav"
                              ? "bg-blue-100 text-blue-800"
                              : threat.scanner === "virustotal"
                              ? "bg-purple-100 text-purple-800"
                              : threat.scanner === "pattern"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {threat.scanner}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="max-w-md">
                          {threat.threats && threat.threats.length > 0 ? (
                            <div className="space-y-1">
                              {threat.threats.map((t, i) => (
                                <div
                                  key={i}
                                  className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                                >
                                  ⚠️ {t}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">Unknown</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {threat.scan_time_ms}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Daily Statistics */}
        {scanStats && scanStats.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden mt-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Daily Scan Statistics
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Last 30 days of scanning activity
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scanner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Scans
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clean
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Threats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Threat Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scanStats.map((stat: ScanStats, index) => (
                    <tr
                      key={`${stat.scan_date}-${stat.scanner}-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(stat.scan_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs">
                          {stat.scanner}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.total_scans}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {stat.total_clean_scans}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {stat.total_threats_detected}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded ${
                            stat.threat_percentage > 10
                              ? "bg-red-100 text-red-800"
                              : stat.threat_percentage > 5
                              ? "bg-orange-100 text-orange-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {stat.threat_percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Configuration Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Scanner Configuration
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>ClamAV:</strong>{" "}
              {process.env.CLAMAV_API_URL ? (
                <span className="text-green-600">✓ Configured</span>
              ) : (
                <span className="text-orange-600">
                  Not configured (using fallback)
                </span>
              )}
            </p>
            <p>
              <strong>VirusTotal:</strong>{" "}
              {process.env.VIRUSTOTAL_API_KEY ? (
                <span className="text-green-600">✓ Configured</span>
              ) : (
                <span className="text-gray-600">Not configured</span>
              )}
            </p>
            <p>
              <strong>Pattern Matching:</strong>{" "}
              <span className="text-green-600">
                ✓ Always available (fallback)
              </span>
            </p>
            <p className="mt-4 text-xs">
              To enable ClamAV or VirusTotal scanning, add{" "}
              <code className="bg-blue-100 px-1 rounded">CLAMAV_API_URL</code>{" "}
              or{" "}
              <code className="bg-blue-100 px-1 rounded">
                VIRUSTOTAL_API_KEY
              </code>{" "}
              to your environment variables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
