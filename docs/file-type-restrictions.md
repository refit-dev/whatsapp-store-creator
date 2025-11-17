# File Type Restrictions

## Overview

Restricts file uploads to safe image formats only (JPG, PNG, WebP) to prevent security vulnerabilities from executable files and malicious content.

## Security Features

### Allowed File Types

- ✅ **JPG/JPEG** - `.jpg`, `.jpeg` (image/jpeg)
- ✅ **PNG** - `.png` (image/png)
- ✅ **WebP** - `.webp` (image/webp)

### Blocked File Types

- ❌ Executable files (.exe, .bat, .cmd, .com, .app, etc.)
- ❌ Scripts (.js, .vbs, .ps1, .sh, .php, .asp, etc.)
- ❌ System files (.dll, .so, .sys, etc.)
- ❌ Archives (.zip, .rar, .tar, etc.)
- ❌ SVG files (can contain embedded scripts)
- ❌ Documents (.pdf, .doc, .xls, etc.)
- ❌ All other non-image formats

### File Size Limit

- Maximum: **5MB** per file
- Configurable in `lib/file-validation.ts`

## Implementation

### Multi-Layer Validation

#### Layer 1: Client-Side (Browser)

```typescript
// File input with accept attribute
<input type="file" accept=".jpg,.jpeg,.png,.webp" />;

// JavaScript validation before upload
import { validateFile } from "@/lib/file-validation";

const validation = validateFile(file);
if (!validation.valid) {
  alert(validation.error);
  return;
}
```

**Benefits:**

- Immediate feedback to users
- Reduces unnecessary uploads
- Improves UX

#### Layer 2: Server-Side (API)

```typescript
import { validateFile, validateFileBuffer } from "@/lib/file-validation";

// Validate file metadata
const clientValidation = validateFile(file);

// Validate file content (magic bytes)
const buffer = Buffer.from(await file.arrayBuffer());
const serverValidation = await validateFileBuffer(buffer, file.name, file.type);
```

**Checks:**

- File extension
- MIME type
- File size
- Magic bytes (file signature)

#### Layer 3: Storage (Supabase)

```typescript
await supabase.storage.createBucket("store-images", {
  public: true,
  fileSizeLimit: 5242880,
  allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
});
```

**Benefits:**

- Storage-level enforcement
- Protects against direct API calls
- Additional security layer

## Magic Byte Validation

Validates actual file content, not just extension:

```typescript
// JPEG: FF D8 FF
const isJPEG = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

// PNG: 89 50 4E 47 0D 0A 1A 0A
const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && ...

// WebP: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
const isWebP = buffer[0] === 0x52 && buffer[1] === 0x49 && ...
```

**Why This Matters:**

- Prevents disguised files (e.g., .exe renamed to .jpg)
- Detects corrupted uploads
- Ensures file integrity

## Files

### New Files

- `lib/file-validation.ts` - Validation utilities
- `supabase/storage-policies.sql` - Storage configuration
- `docs/file-type-restrictions.md` - This documentation

### Modified Files

- `components/ImageUpload.tsx` - Client-side validation
- `app/api/upload/route.ts` - Server-side validation

## Usage Examples

### Basic Validation

```typescript
import { validateFile } from "@/lib/file-validation";

const file = event.target.files[0];
const result = validateFile(file);

if (!result.valid) {
  console.error(result.error);
  // Show error to user
}
```

### Multiple Files

```typescript
import { validateFiles } from "@/lib/file-validation";

const files = Array.from(event.target.files);
const { valid, invalid } = validateFiles(files);

console.log(`${valid.length} valid files`);
console.log(`${invalid.length} rejected files`);

invalid.forEach(({ file, error }) => {
  console.error(`${file.name}: ${error}`);
});
```

### Server-Side Validation

```typescript
import { validateFileBuffer } from "@/lib/file-validation";

const buffer = Buffer.from(await file.arrayBuffer());
const result = await validateFileBuffer(buffer, file.name, file.type);

if (!result.valid) {
  return NextResponse.json({ error: result.error }, { status: 400 });
}
```

### Check File Extension

```typescript
import { validateFileExtension } from "@/lib/file-validation";

if (validateFileExtension("photo.jpg")) {
  // Valid image file
}
```

## Error Messages

### User-Friendly Messages

**Invalid Extension:**

```
File type ".exe" is not allowed. Only JPG, PNG, and WebP images are permitted.
```

**Invalid MIME Type:**

```
File type "application/octet-stream" is not allowed. Only JPG, PNG, and WebP images are permitted.
```

**File Too Large:**

```
File size (7.5MB) exceeds maximum allowed size of 5MB.
```

**Content Mismatch:**

```
File content does not match expected image format. File may be corrupted or disguised.
```

## Configuration

### Adjust Allowed Types

```typescript
// In lib/file-validation.ts

export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
```

### Change File Size Limit

```typescript
// In lib/file-validation.ts

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

### Add More Formats

```typescript
// To allow GIF (be careful with animated GIFs)
export const ALLOWED_EXTENSIONS = [..., '.gif'];
export const ALLOWED_MIME_TYPES = [..., 'image/gif'];

// Add magic byte check
const isGIF = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
```

## Security Considerations

### Why SVG is Blocked

SVG files can contain embedded JavaScript:

```xml
<svg onload="alert('XSS')">
  <script>maliciousCode()</script>
</svg>
```

**Risk:** Cross-site scripting (XSS) attacks

### Why File Content is Checked

Users can rename files:

```bash
# Malicious user renames executable
mv malware.exe innocent-photo.jpg

# Our validation detects this
# Magic bytes don't match JPEG signature
```

### Double Extension Attack

```bash
# Attacker tries: malware.exe.jpg
# Our validation checks actual content, not just last extension
```

## Testing

### Test Valid Files

```typescript
const validFiles = [
  new File([jpegBlob], "photo.jpg", { type: "image/jpeg" }),
  new File([pngBlob], "logo.png", { type: "image/png" }),
  new File([webpBlob], "banner.webp", { type: "image/webp" }),
];

validFiles.forEach((file) => {
  const result = validateFile(file);
  expect(result.valid).toBe(true);
});
```

### Test Invalid Files

```typescript
const invalidFiles = [
  new File([exeBlob], "virus.exe", { type: "application/x-msdownload" }),
  new File([pdfBlob], "doc.pdf", { type: "application/pdf" }),
  new File([svgBlob], "icon.svg", { type: "image/svg+xml" }),
];

invalidFiles.forEach((file) => {
  const result = validateFile(file);
  expect(result.valid).toBe(false);
  expect(result.error).toBeDefined();
});
```

### Test Disguised Files

```typescript
// Executable with .jpg extension
const disguisedFile = new File([exeBuffer], "fake-image.jpg", {
  type: "image/jpeg",
});

const buffer = Buffer.from(await disguisedFile.arrayBuffer());
const result = await validateFileBuffer(
  buffer,
  disguisedFile.name,
  disguisedFile.type
);

expect(result.valid).toBe(false);
expect(result.error).toContain("does not match expected image format");
```

## Monitoring

### Track Rejected Uploads

```typescript
// In upload API
if (!validation.valid) {
  console.warn("File rejected:", {
    filename: file.name,
    type: file.type,
    size: file.size,
    error: validation.error,
    userId: user.id,
  });

  // Optional: Record in database for security monitoring
  await logSecurityEvent({
    type: "invalid_upload_attempt",
    userId: user.id,
    details: { filename: file.name, error: validation.error },
  });
}
```

### Database Tracking

```sql
-- Create table to track invalid upload attempts
CREATE TABLE upload_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  filename TEXT,
  file_type TEXT,
  file_size INTEGER,
  error_message TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Query suspicious activity
SELECT user_id, COUNT(*) as violation_count,
       ARRAY_AGG(filename) as files
FROM upload_violations
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY user_id
HAVING COUNT(*) > 5
ORDER BY violation_count DESC;
```

## User Experience

### Upload Button

```tsx
<input
  type="file"
  accept=".jpg,.jpeg,.png,.webp"
  onChange={handleFileSelect}
/>
<p className="text-xs text-gray-500 mt-1">
  Allowed: JPG, PNG, WebP (Max 5MB)
</p>
```

### Error Display

```tsx
{uploadError && (
  <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
    <div className="flex">
      <svg className="h-5 w-5 text-red-400" /* error icon */>
      <p className="text-sm text-red-700">{uploadError}</p>
    </div>
  </div>
)}
```

### Success Feedback

```tsx
{
  uploadSuccess && (
    <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
      <p className="text-sm text-green-700">✓ Image uploaded successfully</p>
    </div>
  );
}
```

## Best Practices

1. **Validate on Both Sides**

   - Client: Immediate feedback, better UX
   - Server: Security enforcement, cannot be bypassed

2. **Check File Content**

   - Don't trust extensions or MIME types alone
   - Validate magic bytes for true file type

3. **Limit File Sizes**

   - Prevents DOS attacks
   - Reduces storage costs
   - Improves performance

4. **Clear Error Messages**

   - Tell users exactly what's wrong
   - Explain what formats are allowed
   - Show file size limits

5. **Log Security Events**

   - Track invalid upload attempts
   - Monitor for patterns
   - Alert on suspicious activity

6. **Regular Updates**
   - Keep allowed types list current
   - Review blocked types periodically
   - Update magic byte checks

## Troubleshooting

### Users Can't Upload Valid Images

**Check:**

1. File extension is lowercase-matched
2. MIME type is in allowed list
3. File isn't corrupted
4. File size is under limit

**Solution:**

```typescript
const validation = validateFile(file);
console.log("Validation result:", validation);
```

### False Positives

Some image editors add metadata that changes magic bytes.

**Solution:**

```typescript
// Be more lenient with magic byte check
// Just verify it's an image, not exact format
const isImage =
  isJPEG ||
  isPNG ||
  isWebP ||
  buffer.toString("hex", 0, 4).match(/^ffd8|^8950|^5249/);
```

### Storage Bucket Rejects Files

**Check bucket configuration:**

```typescript
const { data } = await supabase.storage.getBucket("store-images");
console.log("Bucket config:", data);
```

**Update if needed:**

```typescript
await supabase.storage.updateBucket("store-images", {
  allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
});
```

## Future Enhancements

### Image Processing

```typescript
// Resize large images
import sharp from "sharp";

const processed = await sharp(buffer)
  .resize(1920, 1080, { fit: "inside" })
  .jpeg({ quality: 80 })
  .toBuffer();
```

### Virus Scanning

```typescript
// Integrate with ClamAV or similar
import { scanFile } from "clamscan";

const virusScan = await scanFile(buffer);
if (!virusScan.isClean) {
  return { valid: false, error: "File failed virus scan" };
}
```

### Image Optimization

```typescript
// Convert to WebP automatically
const webpBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
```

### Content Moderation

```typescript
// Check image content with AI
import { moderateImage } from "@/lib/moderation";

const moderation = await moderateImage(buffer);
if (!moderation.safe) {
  return { valid: false, error: "Image contains inappropriate content" };
}
```

## FAQ

**Q: Why not allow SVG?**
A: SVG files can contain embedded JavaScript, creating XSS vulnerabilities.

**Q: Can users bypass validation?**
A: Client-side validation can be bypassed, but server-side validation with magic byte checks cannot.

**Q: What about HEIC (iPhone photos)?**
A: Consider adding HEIC support with server-side conversion to JPEG/WebP.

**Q: How to allow more file types?**
A: Add to ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, and add magic byte check.

**Q: What if legitimate images are rejected?**
A: Check error message, verify file isn't corrupted, ensure MIME type is correct.

**Q: How to increase file size limit?**
A: Change MAX_FILE_SIZE in file-validation.ts and bucket fileSizeLimit.

## Related Features

- [Image Upload System](./image-upload-fix-guide.md)
- [Storage Setup](./image-upload-guidelines.md)
- [Image Moderation](./image-moderation-system.md) (admin review)
- [API Rate Limiting](./api-rate-limiting.md) (prevents upload spam)
