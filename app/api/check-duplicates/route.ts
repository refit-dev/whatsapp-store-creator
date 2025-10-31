import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { email, mobileNumber } = await request.json();

    if (!email && !mobileNumber) {
      return NextResponse.json(
        { error: "Email or mobile number is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();
    const result = {
      emailExists: false,
      mobileExists: false,
      existingEmailUser: null as { storeName: string; storeId: string } | null,
      existingMobileUser: null as { storeName: string; storeId: string } | null,
    };

    // Check for mobile number duplicates in stores table
    if (mobileNumber && mobileNumber.trim()) {
      // Clean and format the mobile number
      const cleanMobile = mobileNumber.replace(/\D/g, "");

      let formattedMobile = mobileNumber;
      if (cleanMobile.length === 10) {
        formattedMobile = `+91${cleanMobile}`;
      } else if (cleanMobile.length > 10 && !cleanMobile.startsWith("+")) {
        formattedMobile = `+${cleanMobile}`;
      } else if (cleanMobile.startsWith("91") && cleanMobile.length === 12) {
        formattedMobile = `+${cleanMobile}`;
      }

      // Check if mobile number already exists in stores
      const { data: stores, error } = await supabase
        .from("stores")
        .select("id, name, owner_id, whatsapp_e164")
        .eq("whatsapp_e164", formattedMobile)
        .limit(1);

      if (!error && stores && stores.length > 0) {
        result.mobileExists = true;
        result.existingMobileUser = {
          storeName: stores[0].name,
          storeId: stores[0].id,
        };
      }
    }

    // Note: Email duplicate checking is handled by Supabase Auth automatically
    // We'll let the signup process handle that since we can't query auth.users directly

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking duplicates:", error);
    return NextResponse.json(
      { error: "Failed to check for duplicates" },
      { status: 500 }
    );
  }
}
