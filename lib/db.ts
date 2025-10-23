import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "../types/supabase";
import type {
  TableName,
  Row,
  Insert,
  Update,
  QueryOptions,
  SupabaseClient,
} from "../types/supabase-helper";

// Create a type-safe Supabase client
export function createTypedClient(
  url: string,
  key: string,
  options: { auth?: { persistSession: boolean } } = {}
): SupabaseClient {
  return createClient<Database>(url, key, options);
}

// Server-side client with cookie support
export const createServerClient = (useServiceRole = false) => {
  if (useServiceRole) {
    // Service role client (no session needed)
    return createTypedClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }

  // Regular server client with cookie support
  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
};

// Browser-side client
export const createBrowserClient = () => {
  if (typeof window === "undefined") {
    throw new Error("createBrowserClient called on server");
  }

  return createTypedClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Export types for use in other files
export type { SupabaseClient, TableName, Row, Insert, Update, QueryOptions };
