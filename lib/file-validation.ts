/**
 * File Type Validation Utility
 * Restricts uploads to safe image formats only (JPG, PNG, WebP)
 */

// Allowed file extensions
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

// Maximum file size (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Dangerous file extensions to explicitly block
const BLOCKED_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".pif",
  ".scr",
  ".vbs",
  ".js",
  ".jse",
  ".wsf",
  ".wsh",
  ".msi",
  ".msp",
  ".hta",
  ".cpl",
  ".jar",
  ".dll",
  ".so",
  ".app",
  ".deb",
  ".rpm",
  ".dmg",
  ".pkg",
  ".sh",
  ".bash",
  ".ps1",
  ".psm1",
  ".php",
  ".asp",
  ".aspx",
  ".jsp",
  ".svg", // SVG can contain scripts
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
}

/**
 * Validate file extension
 */
export function validateFileExtension(filename: string): boolean {
  const extension = filename.toLowerCase().slice(filename.lastIndexOf("."));

  // Check if explicitly blocked
  if (BLOCKED_EXTENSIONS.includes(extension)) {
    return false;
  }

  // Check if allowed
  return ALLOWED_EXTENSIONS.includes(extension as any);
}

/**
 * Validate MIME type
 */
export function validateMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as any);
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Comprehensive file validation
 * Checks extension, MIME type, and size
 */
export function validateFile(file: File): FileValidationResult {
  // Check file extension
  if (!validateFileExtension(file.name)) {
    const extension = file.name.slice(file.name.lastIndexOf("."));
    return {
      valid: false,
      error: `File type "${extension}" is not allowed. Only JPG, PNG, and WebP images are permitted.`,
    };
  }

  // Check MIME type
  if (!validateMimeType(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Only JPG, PNG, and WebP images are permitted.`,
    };
  }

  // Check file size
  if (!validateFileSize(file.size)) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size (${sizeMB}MB) exceeds maximum allowed size of ${maxMB}MB.`,
    };
  }

  return {
    valid: true,
    file,
  };
}

/**
 * Validate multiple files
 */
export function validateFiles(files: File[]): {
  valid: File[];
  invalid: Array<{ file: File; error: string }>;
} {
  const valid: File[] = [];
  const invalid: Array<{ file: File; error: string }> = [];

  files.forEach((file) => {
    const result = validateFile(file);
    if (result.valid) {
      valid.push(file);
    } else {
      invalid.push({ file, error: result.error || "Invalid file" });
    }
  });

  return { valid, invalid };
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(filename.lastIndexOf(".")).toLowerCase();
}

/**
 * Check if a file is an image by extension
 */
export function isImageFile(filename: string): boolean {
  return validateFileExtension(filename);
}

/**
 * Get user-friendly error message for file validation
 */
export function getFileValidationMessage(file: File): string {
  const validation = validateFile(file);
  if (validation.valid) {
    return "File is valid";
  }
  return validation.error || "File validation failed";
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Server-side file validation (checks buffer/content)
 * Use this in API routes for additional security
 */
export async function validateFileBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<FileValidationResult> {
  // Validate filename and MIME type
  if (!validateFileExtension(filename)) {
    return {
      valid: false,
      error: `File extension not allowed. Only JPG, PNG, and WebP images are permitted.`,
    };
  }

  if (!validateMimeType(mimeType)) {
    return {
      valid: false,
      error: `MIME type "${mimeType}" not allowed. Only image formats are permitted.`,
    };
  }

  // Check file size
  if (!validateFileSize(buffer.length)) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${
        MAX_FILE_SIZE / (1024 * 1024)
      }MB.`,
    };
  }

  // Check magic bytes (file signature) for common image formats
  const magicBytes = buffer.slice(0, 12);

  // JPEG: FF D8 FF
  const isJPEG =
    magicBytes[0] === 0xff && magicBytes[1] === 0xd8 && magicBytes[2] === 0xff;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPNG =
    magicBytes[0] === 0x89 &&
    magicBytes[1] === 0x50 &&
    magicBytes[2] === 0x4e &&
    magicBytes[3] === 0x47 &&
    magicBytes[4] === 0x0d &&
    magicBytes[5] === 0x0a &&
    magicBytes[6] === 0x1a &&
    magicBytes[7] === 0x0a;

  // WebP: 52 49 46 46 ... 57 45 42 50
  const isWebP =
    magicBytes[0] === 0x52 && // R
    magicBytes[1] === 0x49 && // I
    magicBytes[2] === 0x46 && // F
    magicBytes[3] === 0x46 && // F
    magicBytes[8] === 0x57 && // W
    magicBytes[9] === 0x45 && // E
    magicBytes[10] === 0x42 && // B
    magicBytes[11] === 0x50; // P

  if (!isJPEG && !isPNG && !isWebP) {
    return {
      valid: false,
      error:
        "File content does not match expected image format. File may be corrupted or disguised.",
    };
  }

  return { valid: true };
}
