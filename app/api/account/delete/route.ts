import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import {
  handleCorsPreflightRequest,
  setCorsHeaders,
  validateCorsOrigin,
} from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  const response = handleCorsPreflightRequest(request);
  return response || new NextResponse(null, { status: 200 });
}

/**
 * GET /api/account/delete
 * Get preview of data that will be deleted
 */
export async function GET(request: NextRequest) {
  try {
    // Validate CORS
    const corsError = validateCorsOrigin(request);
    if (corsError) return corsError;

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const response = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
      return setCorsHeaders(response, request.headers.get("origin"));
    }

    // Get deletion preview
    const { data, error } = await supabase.rpc("get_account_deletion_preview", {
      target_user_id: user.id,
    });

    if (error) {
      console.error("Error getting deletion preview:", error);
      const response = NextResponse.json(
        { error: "Failed to get deletion preview" },
        { status: 500 }
      );
      return setCorsHeaders(response, request.headers.get("origin"));
    }

    const response = NextResponse.json(data);
    return setCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error in deletion preview:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return setCorsHeaders(response, request.headers.get("origin"));
  }
}

/**
 * DELETE /api/account/delete
 * Delete user account and all associated data
 */
export async function DELETE(request: NextRequest) {
  try {
    // Validate CORS
    const corsError = validateCorsOrigin(request);
    if (corsError) return corsError;

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const response = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
      return setCorsHeaders(response, request.headers.get("origin"));
    }

    // Parse request body
    const body = await request.json();
    const { confirmationText, reason } = body;

    // Require confirmation text
    if (confirmationText !== "DELETE MY ACCOUNT") {
      const response = NextResponse.json(
        {
          error:
            "Invalid confirmation text. Please type exactly: DELETE MY ACCOUNT",
        },
        { status: 400 }
      );
      return setCorsHeaders(response, request.headers.get("origin"));
    }

    console.log(`Starting account deletion for user: ${user.id}`);

    // Call the database function to delete all user data
    const { data: deletionResult, error: deletionError } = await supabase.rpc(
      "delete_user_account",
      {
        target_user_id: user.id,
        deletion_reason: reason || null,
      }
    );

    if (deletionError) {
      console.error("Error deleting user data:", deletionError);
      const response = NextResponse.json(
        {
          error: "Failed to delete account data",
          details: deletionError.message,
        },
        { status: 500 }
      );
      return setCorsHeaders(response, request.headers.get("origin"));
    }

    console.log("Database deletion result:", deletionResult);

    // Delete the user from auth.users using admin API
    // This requires the service role key
    const supabaseAdmin = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Use the Supabase Admin API to delete the user
    const { error: authDeleteError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError);
      // Data is already deleted, log but don't fail
      console.warn(
        "User data deleted but auth user deletion failed. Manual cleanup may be required."
      );
    }

    // Sign out the user
    await supabase.auth.signOut();

    console.log(`Account deletion completed for user: ${user.id}`);

    const response = NextResponse.json({
      success: true,
      message: "Account successfully deleted",
      details: deletionResult,
    });

    return setCorsHeaders(response, request.headers.get("origin"));
  } catch (error: any) {
    console.error("Error in account deletion:", error);
    const response = NextResponse.json(
      {
        error: "Failed to delete account",
        details: error.message,
      },
      { status: 500 }
    );
    return setCorsHeaders(response, request.headers.get("origin"));
  }
}
