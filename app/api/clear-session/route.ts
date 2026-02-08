import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

export async function GET() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Clear all auth-related cookies
  const response = NextResponse.redirect(
    new URL("/auth", process.env.APP_URL || "http://localhost:5000"),
  );

  // Clear Supabase cookies
  // Note: Update the cookie name to match your Supabase project
  // Cookie name format: sb-{project-ref}-auth-token
  // You can find your project ref in your Supabase URL: https://{project-ref}.supabase.co
  response.cookies.delete("sb-your-project-ref-auth-token");
  response.cookies.delete("sb-access-token");
  response.cookies.delete("sb-refresh-token");

  return response;
}
