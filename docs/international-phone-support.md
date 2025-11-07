# International Phone Number Support

## Overview

The WhatsApp Store Creator now supports international phone numbers with a country code selector during signup. Users from any country can sign up and add their phone numbers with the appropriate country code.

## Features

### Country Code Selector

- **Default Country**: India (+91) - most common user base
- **20+ Countries Supported**: Includes major markets worldwide
- **Visual Interface**: Country flags + country codes for easy selection
- **Responsive Dropdown**: Scrollable list with click-to-select functionality

### Supported Countries

| Flag | Country        | Code | Format Example    |
| ---- | -------------- | ---- | ----------------- |
| 🇮🇳   | India          | +91  | +91 98765 43210   |
| 🇺🇸   | United States  | +1   | +1 555 123 4567   |
| 🇨🇦   | Canada         | +1   | +1 416 123 4567   |
| 🇬🇧   | United Kingdom | +44  | +44 20 7946 0958  |
| 🇫🇷   | France         | +33  | +33 1 42 34 56 78 |
| 🇩🇪   | Germany        | +49  | +49 30 12345678   |
| 🇯🇵   | Japan          | +81  | +81 3 1234 5678   |
| 🇨🇳   | China          | +86  | +86 138 0013 8000 |
| 🇦🇺   | Australia      | +61  | +61 412 345 678   |
| 🇦🇪   | UAE            | +971 | +971 50 123 4567  |
| 🇸🇦   | Saudi Arabia   | +966 | +966 50 123 4567  |
| 🇸🇬   | Singapore      | +65  | +65 8123 4567     |
| 🇲🇾   | Malaysia       | +60  | +60 12 345 6789   |
| 🇮🇩   | Indonesia      | +62  | +62 812 3456 789  |
| 🇵🇭   | Philippines    | +63  | +63 917 123 4567  |
| 🇹🇭   | Thailand       | +66  | +66 81 234 5678   |
| 🇻🇳   | Vietnam        | +84  | +84 90 123 4567   |
| 🇰🇷   | South Korea    | +82  | +82 10 1234 5678  |
| 🇭🇰   | Hong Kong      | +852 | +852 9123 4567    |
| 🇿🇦   | South Africa   | +27  | +27 82 123 4567   |

## Technical Implementation

### Components

#### CountryCodeSelector (`components/CountryCodeSelector.tsx`)

- **Props**:
  - `value: string` - Current selected country code
  - `onChange: (code: string) => void` - Callback when country changes
  - `className?: string` - Optional CSS classes
- **Features**:
  - Dropdown with country flags and codes
  - Click outside to close functionality
  - Keyboard accessible
  - Responsive design

#### Updated AuthClient (`app/auth/AuthClient.tsx`)

- **New State**:
  - `countryCode` - Currently selected country code (default: "+91")
  - `mobileNumber` - Phone number without country code
- **Enhanced Validation**:
  - Combines country code + phone number for validation
  - International phone number format support
  - Duplicate checking with full international number

### User Experience Flow

1. **Country Selection**:

   ```
   User clicks country selector → Dropdown opens → Select country → Updates country code
   ```

2. **Phone Input**:

   ```
   User enters: "98765 43210"
   + Selected country: "+91"
   = Final number: "+919876543210"
   ```

3. **Validation & Storage**:
   ```
   Input: Country code + Phone → Validate format → Check duplicates → Store in E.164 format
   ```

### Data Flow

#### Signup Process

```typescript
// User inputs
countryCode = "+91";
mobileNumber = "98765 43210";

// Processing
fullNumber = "+919876543210"; // Combined and cleaned
formattedNumber = formatMobileNumber(fullNumber); // E.164 format
```

#### Validation

```typescript
// International validation
validateMobileNumber("+919876543210"); // Returns true/false
validateMobileNumber("+14155552671"); // US number - valid
validateMobileNumber("+442071838750"); // UK number - valid
```

#### Database Storage

```sql
-- Stored in E.164 format
user_metadata: {
  mobile_number: "+919876543210"
}

-- Store WhatsApp number
stores.whatsapp_e164: "+919876543210"
```

## Usage Examples

### Basic Implementation

```tsx
import { CountryCodeSelector } from "@/components/CountryCodeSelector";

function PhoneInput() {
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");

  return (
    <div className="flex">
      <CountryCodeSelector value={countryCode} onChange={setCountryCode} />
      <input
        type="tel"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="98765 43210"
      />
    </div>
  );
}
```

### Full Integration

```tsx
// Combine for validation/submission
const fullNumber = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;

// Validate international format
if (!validateMobileNumber(fullNumber)) {
  setError("Please enter a valid phone number for selected country");
}

// Submit with formatted number
await signUp({
  email,
  password,
  options: {
    data: {
      mobile_number: formatMobileNumber(fullNumber),
    },
  },
});
```

## WhatsApp Integration

### Global Compatibility

- **WhatsApp Business API**: Supports all international numbers
- **OTP Verification**: Works globally with proper country codes
- **Message Delivery**: International message routing supported

### Number Format Requirements

- **Input**: Any local format (`98765 43210`)
- **Storage**: E.164 format (`+919876543210`)
- **Display**: Formatted for readability (`+91 98765 43210`)

## Customization

### Adding New Countries

```typescript
// In CountryCodeSelector.tsx
const COUNTRY_CODES = [
  // Add new country
  { code: "+55", country: "BR", flag: "🇧🇷", name: "Brazil" },
  // ... existing countries
];
```

### Changing Default Country

```typescript
// In AuthClient.tsx
const [countryCode, setCountryCode] = useState("+1"); // US default
```

### Custom Styling

```tsx
<CountryCodeSelector
  value={countryCode}
  onChange={setCountryCode}
  className="custom-selector-class"
/>
```

## Validation Rules

### Phone Number Formats

- **Minimum Length**: 10 digits (excluding country code)
- **Maximum Length**: 15 digits total (including country code)
- **Allowed Characters**: Numbers only (spaces and dashes stripped)
- **International Standard**: E.164 format for storage

### Error Messages

- Invalid format: "Please enter a valid phone number for selected country"
- Duplicate number: "A store with mobile number '+919876543210' already exists"
- Missing number: "Mobile number is required"

## Testing

### Test Cases

1. **Country Selection**: Verify all countries can be selected
2. **Phone Validation**: Test valid/invalid numbers per country
3. **Duplicate Detection**: Check international number uniqueness
4. **E.164 Conversion**: Ensure proper format storage
5. **WhatsApp Integration**: Verify OTP works internationally

### Sample Test Numbers

```typescript
// Valid international numbers
"+919876543210"; // India
"+14155552671"; // US
"+442071838750"; // UK
"+815012345678"; // Japan
```

## Migration Notes

### Existing Users

- **Backward Compatible**: Existing Indian numbers continue to work
- **No Data Migration**: Current format already supports international
- **Graceful Upgrade**: New selector appears for all future signups

### Database Impact

- **No Schema Changes**: Uses existing `mobile_number` field
- **Format Consistency**: All numbers stored in E.164 format
- **Query Compatibility**: Existing duplicate checks still work

The international phone number support makes the platform accessible to users worldwide while maintaining the existing functionality for current Indian users.
