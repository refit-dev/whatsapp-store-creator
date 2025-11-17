/**
 * Virus Scanner Utility
 *
 * Provides virus/malware scanning for uploaded files using multiple methods:
 * 1. ClamAV REST API (self-hosted or cloud service)
 * 2. VirusTotal API (optional)
 * 3. File pattern matching (fallback)
 *
 * Setup Instructions:
 * 1. For ClamAV: Set CLAMAV_API_URL in environment variables
 * 2. For VirusTotal: Set VIRUSTOTAL_API_KEY (optional)
 * 3. Scanner automatically falls back to pattern matching if APIs unavailable
 */

export interface ScanResult {
  clean: boolean;
  infected: boolean;
  threats?: string[];
  scanner: "clamav" | "virustotal" | "pattern" | "none";
  scanTime: number;
  error?: string;
}

interface ClamAVResponse {
  data: {
    result: string;
    viruses?: string[];
  };
}

interface VirusTotalResponse {
  data: {
    attributes: {
      last_analysis_stats: {
        malicious: number;
        suspicious: number;
      };
      last_analysis_results: Record<
        string,
        { category: string; result: string }
      >;
    };
  };
}

// Suspicious file patterns (executable headers, scripts)
const SUSPICIOUS_PATTERNS = [
  // Windows executables
  { pattern: Buffer.from([0x4d, 0x5a]), name: "PE/EXE" }, // MZ (DOS/Windows)
  { pattern: Buffer.from([0x50, 0x4b, 0x03, 0x04]), name: "ZIP/JAR" }, // ZIP (could contain malware)

  // Scripts (should be caught by file-validation, but double-check)
  { pattern: Buffer.from("<?php"), name: "PHP script" },
  { pattern: Buffer.from("<script"), name: "JavaScript" },
  { pattern: Buffer.from("#!/bin/"), name: "Shell script" },
  { pattern: Buffer.from("#!/usr/bin/"), name: "Shell script" },

  // Office macros
  { pattern: Buffer.from([0xd0, 0xcf, 0x11, 0xe0]), name: "OLE/Office Doc" }, // MS Office old format

  // Java class files
  { pattern: Buffer.from([0xca, 0xfe, 0xba, 0xbe]), name: "Java class" },

  // Mach-O executables (macOS)
  { pattern: Buffer.from([0xcf, 0xfa, 0xed, 0xfe]), name: "Mach-O" },
  { pattern: Buffer.from([0xce, 0xfa, 0xed, 0xfe]), name: "Mach-O" },

  // ELF executables (Linux)
  { pattern: Buffer.from([0x7f, 0x45, 0x4c, 0x46]), name: "ELF" },
];

/**
 * Scan file using ClamAV REST API
 * Requires ClamAV REST API endpoint (can use clamav-rest Docker image)
 */
async function scanWithClamAV(buffer: Buffer): Promise<ScanResult> {
  const startTime = Date.now();
  const apiUrl = process.env.CLAMAV_API_URL;

  if (!apiUrl) {
    return {
      clean: false,
      infected: false,
      scanner: "none",
      scanTime: 0,
      error: "ClamAV not configured",
    };
  }

  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)]);
    formData.append("file", blob, "upload.bin");

    const response = await fetch(`${apiUrl}/scan`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ClamAV API error: ${response.statusText}`);
    }

    const result = (await response.json()) as ClamAVResponse;
    const scanTime = Date.now() - startTime;

    return {
      clean: result.data.result === "OK",
      infected: result.data.result !== "OK",
      threats: result.data.viruses,
      scanner: "clamav",
      scanTime,
    };
  } catch (error) {
    const scanTime = Date.now() - startTime;
    return {
      clean: false,
      infected: false,
      scanner: "clamav",
      scanTime,
      error: error instanceof Error ? error.message : "ClamAV scan failed",
    };
  }
}

/**
 * Scan file using VirusTotal API
 * Requires API key from virustotal.com
 * Note: Free tier has rate limits (4 requests/minute)
 */
async function scanWithVirusTotal(buffer: Buffer): Promise<ScanResult> {
  const startTime = Date.now();
  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  if (!apiKey) {
    return {
      clean: false,
      infected: false,
      scanner: "none",
      scanTime: 0,
      error: "VirusTotal not configured",
    };
  }

  try {
    // Upload file for scanning
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)]);
    formData.append("file", blob);

    const uploadResponse = await fetch(
      "https://www.virustotal.com/api/v3/files",
      {
        method: "POST",
        headers: {
          "x-apikey": apiKey,
        },
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      throw new Error(`VirusTotal upload error: ${uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();
    const analysisId = uploadResult.data.id;

    // Wait for analysis (poll for results)
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      const analysisResponse = await fetch(
        `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
        {
          headers: {
            "x-apikey": apiKey,
          },
        }
      );

      if (!analysisResponse.ok) {
        throw new Error(
          `VirusTotal analysis error: ${analysisResponse.statusText}`
        );
      }

      const analysisResult =
        (await analysisResponse.json()) as VirusTotalResponse;
      const stats = analysisResult.data.attributes.last_analysis_stats;

      if (stats) {
        const scanTime = Date.now() - startTime;
        const malicious = stats.malicious || 0;
        const suspicious = stats.suspicious || 0;

        const threats: string[] = [];
        if (malicious > 0 || suspicious > 0) {
          Object.entries(
            analysisResult.data.attributes.last_analysis_results
          ).forEach(([engine, result]) => {
            if (
              result.category === "malicious" ||
              result.category === "suspicious"
            ) {
              threats.push(`${engine}: ${result.result}`);
            }
          });
        }

        return {
          clean: malicious === 0 && suspicious === 0,
          infected: malicious > 0 || suspicious > 0,
          threats: threats.length > 0 ? threats : undefined,
          scanner: "virustotal",
          scanTime,
        };
      }

      attempts++;
    }

    throw new Error("VirusTotal analysis timeout");
  } catch (error) {
    const scanTime = Date.now() - startTime;
    return {
      clean: false,
      infected: false,
      scanner: "virustotal",
      scanTime,
      error: error instanceof Error ? error.message : "VirusTotal scan failed",
    };
  }
}

/**
 * Pattern-based scanning (fallback method)
 * Checks for known suspicious file patterns
 */
function scanWithPatterns(buffer: Buffer): ScanResult {
  const startTime = Date.now();
  const threats: string[] = [];

  // Check first 512 bytes for suspicious patterns
  const headerSize = Math.min(buffer.length, 512);
  const header = buffer.subarray(0, headerSize);

  for (const { pattern, name } of SUSPICIOUS_PATTERNS) {
    if (header.includes(pattern)) {
      threats.push(name);
    }
  }

  // Check for embedded scripts in "image" files
  const content = buffer.toString("utf-8", 0, headerSize);

  if (
    content.includes("<script") ||
    content.includes("<?php") ||
    content.includes("eval(")
  ) {
    threats.push("Embedded script detected");
  }

  const scanTime = Date.now() - startTime;

  return {
    clean: threats.length === 0,
    infected: threats.length > 0,
    threats: threats.length > 0 ? threats : undefined,
    scanner: "pattern",
    scanTime,
  };
}

/**
 * Main scanning function
 * Tries multiple scanning methods in order:
 * 1. ClamAV (if configured)
 * 2. VirusTotal (if configured and ClamAV fails)
 * 3. Pattern matching (fallback)
 */
export async function scanFile(buffer: Buffer): Promise<ScanResult> {
  // Try ClamAV first (fastest, self-hosted)
  if (process.env.CLAMAV_API_URL) {
    const clamavResult = await scanWithClamAV(buffer);

    if (!clamavResult.error) {
      return clamavResult;
    }

    console.warn("ClamAV scan failed:", clamavResult.error);
  }

  // Try VirusTotal (cloud-based, rate limited)
  if (process.env.VIRUSTOTAL_API_KEY) {
    const virusTotalResult = await scanWithVirusTotal(buffer);

    if (!virusTotalResult.error) {
      return virusTotalResult;
    }

    console.warn("VirusTotal scan failed:", virusTotalResult.error);
  }

  // Fallback to pattern matching
  console.log("Using pattern-based scanning (fallback)");
  return scanWithPatterns(buffer);
}

/**
 * Quick scan using only pattern matching
 * Useful for fast validation without API calls
 */
export function quickScan(buffer: Buffer): ScanResult {
  return scanWithPatterns(buffer);
}

/**
 * Check if virus scanning is properly configured
 */
export function isScannerConfigured(): {
  configured: boolean;
  methods: string[];
} {
  const methods: string[] = [];

  if (process.env.CLAMAV_API_URL) {
    methods.push("ClamAV");
  }

  if (process.env.VIRUSTOTAL_API_KEY) {
    methods.push("VirusTotal");
  }

  methods.push("Pattern Matching (fallback)");

  return {
    configured: methods.length > 1, // More than just pattern matching
    methods,
  };
}
