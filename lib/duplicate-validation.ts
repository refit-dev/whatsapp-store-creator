export interface ExistingUserInfo {
  storeName: string;
  storeId: string;
}

export interface DuplicateCheckResult {
  emailExists: boolean;
  mobileExists: boolean;
  existingEmailUser?: ExistingUserInfo;
  existingMobileUser?: ExistingUserInfo;
}

export async function checkForDuplicates(
  email: string,
  mobileNumber?: string
): Promise<DuplicateCheckResult> {
  const result: DuplicateCheckResult = {
    emailExists: false,
    mobileExists: false,
  };

  try {
    const response = await fetch("/api/check-duplicates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        mobileNumber,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        emailExists: data.emailExists || false,
        mobileExists: data.mobileExists || false,
        existingEmailUser: data.existingEmailUser,
        existingMobileUser: data.existingMobileUser,
      };
    }

    return result;
  } catch (error) {
    console.error("Error checking for duplicates:", error);
    return result;
  }
}

export function formatMobileNumber(mobile: string): string {
  // Remove all non-digit characters
  const cleanMobile = mobile.replace(/\D/g, "");

  // Add country code if not present (assuming +91 for India by default)
  if (cleanMobile.length === 10) {
    return `+91${cleanMobile}`;
  } else if (cleanMobile.length > 10 && !cleanMobile.startsWith("+")) {
    return `+${cleanMobile}`;
  } else if (cleanMobile.startsWith("91") && cleanMobile.length === 12) {
    return `+${cleanMobile}`;
  }

  return mobile; // Return as is if we can't format it
}

export function validateMobileNumber(mobile: string): boolean {
  const cleanMobile = mobile.replace(/\D/g, "");

  // Valid formats:
  // 10 digits (Indian mobile without country code)
  // 12 digits starting with 91 (Indian mobile with country code)
  // Any international number with country code (8-15 digits)

  if (cleanMobile.length === 10) {
    return true; // Indian mobile without country code
  }

  if (cleanMobile.length === 12 && cleanMobile.startsWith("91")) {
    return true; // Indian mobile with country code
  }

  if (cleanMobile.length >= 8 && cleanMobile.length <= 15) {
    return true; // International mobile numbers
  }

  return false;
}
