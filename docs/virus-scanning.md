# Virus/Malware Scanning System

Complete documentation for the virus and malware scanning system that protects your application from malicious file uploads.

## Overview

The virus scanning system provides multi-layered protection against malicious file uploads:

1. **Pattern-based scanning** (always active) - Fast, local detection of known malicious patterns
2. **ClamAV integration** (optional) - Professional open-source antivirus engine
3. **VirusTotal API** (optional) - Cloud-based multi-engine scanning
4. **Automatic threat blocking** - Infected files are rejected before storage
5. **Admin monitoring** - Dashboard for tracking threats and scan statistics

## Features

### ✅ What's Protected

- **All uploaded files** are scanned before storage
- **Executable files** (.exe, .bat, .cmd, .msi, etc.)
- **Script files** (.js, .php, .asp, shell scripts)
- **Embedded malware** in images (steganography)
- **Office macros** (old MS Office formats)
- **Archive bombs** (detected by size validation)

### 🛡️ Security Layers

1. **File validation** - Extension, MIME type, magic bytes
2. **Pattern matching** - Known malicious file signatures
3. **ClamAV scanning** - Professional virus engine (optional)
4. **VirusTotal** - 70+ antivirus engines (optional)
5. **Audit logging** - All scans tracked in database

## Scanner Methods

### 1. Pattern Matching (Fallback)

**Always active** - Built-in detection of suspicious patterns.

**Detects:**

- Windows executables (PE/MZ headers)
- Shell scripts (#!/bin/bash, etc.)
- PHP/JavaScript code
- Java class files
- Mach-O executables (macOS)
- ELF executables (Linux)
- Embedded scripts in images

**Advantages:**

- ⚡ Fast (< 10ms)
- 🔒 No external dependencies
- 💰 Free
- 🌐 Works offline

**Limitations:**

- Only detects known patterns
- Can't detect new/polymorphic malware
- No virus database updates

### 2. ClamAV (Recommended)

**Optional** - Professional open-source antivirus engine.

**Setup:**

```bash
# Option 1: Docker (easiest)
docker run -d -p 8080:8080 mkodockx/docker-clamav:alpine

# Option 2: ClamAV REST API
git clone https://github.com/benzino77/clamav-rest-api
cd clamav-rest-api
docker-compose up -d
```

**Configuration:**

```bash
# .env.local
CLAMAV_API_URL=http://localhost:8080
```

**Advantages:**

- 🔬 Real virus detection engine
- 📦 Regular virus database updates
- 🏢 Enterprise-grade protection
- 🆓 Free and open-source
- 🔒 Self-hosted (privacy)

**Performance:**

- Scan time: 50-500ms per file
- Memory: ~500MB for ClamAV daemon
- Accuracy: Industry-standard

### 3. VirusTotal API

**Optional** - Cloud-based multi-engine scanning (70+ engines).

**Setup:**

1. Sign up at [virustotal.com](https://www.virustotal.com/)
2. Get free API key (4 requests/minute)
3. Add to environment:

```bash
# .env.local
VIRUSTOTAL_API_KEY=your_api_key_here
```

**Advantages:**

- 🎯 70+ antivirus engines
- ☁️ No infrastructure needed
- 🔄 Always up-to-date
- 📊 Detailed threat reports

**Limitations:**

- 🐌 Slower (2-10 seconds)
- 🔢 Rate limited (4 req/min free tier)
- 💰 Paid for higher limits
- 🌐 Requires internet
- 🔓 Files sent to third party

**Performance:**

- Scan time: 2-10 seconds
- Rate limit: 4 requests/minute (free)
- Cost: Free tier available

## Implementation

### Database Schema

```sql
-- Scan results tracking
CREATE TABLE virus_scans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  scanner TEXT NOT NULL, -- 'clamav', 'virustotal', 'pattern', 'none'
  infected BOOLEAN NOT NULL,
  threats TEXT[], -- Array of threat names
  scan_time_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Statistics view
CREATE VIEW virus_scan_stats AS
SELECT
  COUNT(*) FILTER (WHERE infected = true) as total_threats_detected,
  COUNT(*) FILTER (WHERE infected = false) as total_clean_scans,
  scanner,
  DATE(created_at) as scan_date
FROM virus_scans
GROUP BY scanner, DATE(created_at);

-- Recent threats view
CREATE VIEW recent_threats AS
SELECT
  virus_scans.*,
  stores.store_name,
  stores.handle
FROM virus_scans
LEFT JOIN stores ON virus_scans.user_id = stores.user_id
WHERE virus_scans.infected = true
ORDER BY virus_scans.created_at DESC;
```

### API Integration

The scanning is automatically integrated into the upload API:

```typescript
// app/api/upload/route.ts
import { scanFile } from "@/lib/virus-scanner";

// After file validation, before storage
const scanResult = await scanFile(buffer);

if (scanResult.infected) {
  // Log to database
  await supabase.from("virus_scans").insert({
    user_id: user.id,
    filename: file.name,
    infected: true,
    threats: scanResult.threats,
    scanner: scanResult.scanner,
  });

  // Reject upload
  return NextResponse.json(
    { error: `Threat detected: ${scanResult.threats.join(", ")}` },
    { status: 400 }
  );
}
```

### Usage Example

```typescript
import { scanFile, quickScan, isScannerConfigured } from "@/lib/virus-scanner";

// Full scan (tries all methods)
const result = await scanFile(fileBuffer);
if (result.infected) {
  console.error("Threats:", result.threats);
}

// Quick scan (pattern matching only)
const quickResult = quickScan(fileBuffer);

// Check scanner configuration
const config = isScannerConfigured();
console.log("Scanners:", config.methods);
// Output: ["ClamAV", "Pattern Matching (fallback)"]
```

### Scan Result Interface

```typescript
interface ScanResult {
  clean: boolean; // true if no threats
  infected: boolean; // true if threats found
  threats?: string[]; // Array of threat names
  scanner: "clamav" | "virustotal" | "pattern" | "none";
  scanTime: number; // Scan duration in ms
  error?: string; // Error message if scan failed
}
```

## Admin Dashboard

Access virus scan monitoring at: `/admin/security/virus-scans`

**Features:**

- 📊 Overall statistics (total scans, threats, clean files)
- 🔍 Scanner usage breakdown
- ⚠️ Recent threats table with details
- 📈 Daily scan statistics (last 30 days)
- ⚙️ Configuration status

**Statistics shown:**

- Total scans performed
- Clean files vs. threats detected
- Threat detection rate percentage
- Scanner method distribution
- Recent blocked uploads with threat details

## Configuration

### Environment Variables

```bash
# Optional: ClamAV REST API endpoint
CLAMAV_API_URL=http://localhost:8080

# Optional: VirusTotal API key
VIRUSTOTAL_API_KEY=your_api_key_here

# Optional: Log all scans (including clean files)
LOG_ALL_SCANS=false  # Set to true for complete audit trail
```

### Scanning Behavior

**Default behavior:**

1. Try ClamAV if configured
2. Fall back to VirusTotal if ClamAV fails
3. Fall back to pattern matching if no APIs available

**Logging behavior:**

- **Infected files:** Always logged to database
- **Clean files:** Only logged if `LOG_ALL_SCANS=true`

### Recommended Setup

**For production:**

```bash
# Self-hosted ClamAV (best balance)
CLAMAV_API_URL=http://your-clamav-server:8080
LOG_ALL_SCANS=false  # Log only threats
```

**For development:**

```bash
# Pattern matching only (no setup needed)
# Leave CLAMAV_API_URL and VIRUSTOTAL_API_KEY unset
LOG_ALL_SCANS=true  # Full audit trail
```

**For maximum security:**

```bash
# Both ClamAV and VirusTotal
CLAMAV_API_URL=http://your-clamav-server:8080
VIRUSTOTAL_API_KEY=your_api_key
LOG_ALL_SCANS=true
```

## Testing

### Test with Safe Files

```bash
# Upload a legitimate image
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg"

# Should return: { "url": "...", "filename": "..." }
```

### Test with Suspicious Patterns

```bash
# Create test file with executable header
echo -ne '\x4D\x5A' > test-malware.jpg

# Upload should be rejected
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-malware.jpg"

# Should return: { "error": "Threat detected: PE/EXE" }
```

### Test with EICAR Test File

The EICAR test file is a standard for testing antivirus software:

```bash
# Create EICAR test file
echo 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*' > eicar.com

# Rename to look like image
mv eicar.com eicar.jpg

# Upload should be rejected
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@eicar.jpg"

# ClamAV/VirusTotal should detect: "EICAR-Test-File"
```

## Maintenance

### Database Cleanup

Clean up old scan records (keeps infected records indefinitely):

```sql
-- Manual cleanup (via Supabase SQL Editor)
SELECT cleanup_old_virus_scans();

-- Or schedule with pg_cron
SELECT cron.schedule(
  'cleanup-virus-scans',
  '0 2 * * 0',  -- Every Sunday at 2 AM
  'SELECT cleanup_old_virus_scans();'
);
```

### Update Virus Definitions

**ClamAV:**

```bash
# Update virus database (if using Docker)
docker exec clamav freshclam

# Restart ClamAV service
docker restart clamav
```

**VirusTotal:**

- No updates needed (always current)

**Pattern Matching:**

- Update `SUSPICIOUS_PATTERNS` in `lib/virus-scanner.ts`

## Performance Optimization

### Speed Comparison

| Scanner    | Avg Time | Accuracy  | Cost      |
| ---------- | -------- | --------- | --------- |
| Pattern    | 5-10ms   | Basic     | Free      |
| ClamAV     | 50-500ms | High      | Free      |
| VirusTotal | 2-10s    | Very High | Free/Paid |

### Optimization Tips

1. **Use ClamAV for production** (good balance)
2. **Enable caching** for repeat uploads (same hash)
3. **Scan async** for large files (queue system)
4. **Skip scan** for trusted admins (optional)

### Async Scanning (Future Enhancement)

For very large files or high traffic:

```typescript
// Queue scan for background processing
await scanQueue.add({
  userId: user.id,
  fileUrl: uploadedUrl,
  buffer: fileBuffer,
});

// Return immediately, scan later
return NextResponse.json({
  url: uploadedUrl,
  scanStatus: "pending",
});
```

## Troubleshooting

### ClamAV Connection Failed

**Symptoms:**

```
ClamAV scan failed: fetch failed
```

**Solutions:**

1. Check ClamAV is running: `docker ps | grep clamav`
2. Verify URL: `curl http://localhost:8080/health`
3. Check firewall settings
4. Restart ClamAV: `docker restart clamav`

### VirusTotal Rate Limit

**Symptoms:**

```
VirusTotal scan failed: Rate limit exceeded
```

**Solutions:**

1. Use free tier: Max 4 requests/minute
2. Upgrade to premium for higher limits
3. Fall back to ClamAV or pattern matching
4. Implement request queuing

### False Positives

**Symptoms:**
Clean files marked as infected.

**Solutions:**

1. Check pattern matching rules in `lib/virus-scanner.ts`
2. Add exceptions for specific patterns
3. Use ClamAV/VirusTotal for better accuracy
4. Review admin dashboard for patterns

### Scanner Not Working

**Symptoms:**
All scans use "pattern" method.

**Check:**

```typescript
import { isScannerConfigured } from "@/lib/virus-scanner";

const config = isScannerConfigured();
console.log(config);
// { configured: false, methods: ["Pattern Matching (fallback)"] }
```

**Solutions:**

1. Verify environment variables are set
2. Restart application after adding env vars
3. Check ClamAV/VirusTotal connectivity
4. Review server logs for errors

## Security Considerations

### What's Protected

✅ Executable file uploads
✅ Script file uploads  
✅ Embedded malware in images
✅ Known virus signatures
✅ Suspicious file patterns

### What's NOT Protected

❌ Zero-day exploits (unknown malware)
❌ Encrypted/packed malware (without proper scanner)
❌ Social engineering attacks
❌ Content-based attacks (phishing images)

### Additional Security Measures

1. **Content Security Policy** - Prevent script execution
2. **Sandboxed viewing** - Isolate file viewing
3. **Image processing** - Re-encode images to strip metadata
4. **CDN with scanning** - CloudFlare, etc.
5. **User education** - Train users on safe uploads

## Future Enhancements

### Planned Features

1. **Async scanning** - Background processing for large files
2. **Scan caching** - Cache results by file hash
3. **Quarantine system** - Store suspicious files for review
4. **AI-based detection** - Machine learning for unknown threats
5. **Image processing** - Strip EXIF, re-encode images
6. **Reputation scoring** - Track users with frequent violations

### Integration Options

1. **AWS S3 + Lambda** - Serverless scanning
2. **CloudFlare Images** - Built-in malware protection
3. **MetaDefender** - Commercial multi-engine scanner
4. **OPSWAT** - Professional file sanitization

## Migration Guide

To add virus scanning to existing application:

1. **Run migration:**

```bash
# Apply database schema
psql $DATABASE_URL -f supabase/migrations/20251117000001_add_virus_scanning.sql
```

2. **Update upload route:**

```typescript
import { scanFile } from "@/lib/virus-scanner";
// Add scanning before storage (see API Integration)
```

3. **Configure scanners:**

```bash
# Add to .env.local
CLAMAV_API_URL=http://localhost:8080  # Optional
```

4. **Test scanning:**

```bash
# Upload test file
npm run dev
# Upload image via UI or API
```

5. **Monitor results:**

```
# Visit admin dashboard
http://localhost:3000/admin/security/virus-scans
```

## Support

For issues or questions:

1. Check logs: `console.log` output in upload API
2. Review admin dashboard for scan statistics
3. Test with EICAR file to verify scanner working
4. Check environment variables are set correctly

## References

- [ClamAV Documentation](https://www.clamav.net/documents)
- [VirusTotal API Docs](https://developers.virustotal.com/reference)
- [EICAR Test File](https://www.eicar.org/download-anti-malware-testfile/)
- [File Magic Bytes](https://en.wikipedia.org/wiki/List_of_file_signatures)

---

**Security Note:** Virus scanning is one layer of defense. Always use multiple security measures including file validation, user authentication, rate limiting, and regular security audits.
