import {
  createClient,
  SupabaseClient as BaseSupabaseClient,
} from "@supabase/supabase-js";
import type { Database } from "./supabase";

// Core database schema types
export type Schema = Database["public"];
export type Tables = Schema["Tables"];
export type Views = Schema["Views"];

// Table and view row types
export type TablesRow<T extends keyof Tables> = Tables[T]["Row"];
export type TablesInsert<T extends keyof Tables> = Tables[T]["Insert"];
export type TablesUpdate<T extends keyof Tables> = Tables[T]["Update"];
export type ViewsRow<T extends keyof Views> = Views[T]["Row"];

// JSON type helpers
export type Json = Database["public"]["Tables"]["orders"]["Row"]["items"];
export type JsonValue = Json | JsonArray;
export type JsonArray = Json[] | null;

// Helper functions for type assertions
export function assertResponse<T>(result: {
  data: T | null;
  error: Error | null;
}): T | null {
  if (result.error) throw result.error;
  return result.data;
}

export function assertSingleResponse<T>(result: {
  data: T[] | null;
  error: Error | null;
}): T {
  if (result.error) throw result.error;
  if (!result.data?.length) throw new Error("No results found");
  return result.data[0];
}

export function assertInsertResponse<T>(result: {
  data: T[] | null;
  error: Error | null;
}): T {
  if (result.error) throw result.error;
  if (!result.data?.length) throw new Error("Insert failed");
  return result.data[0];
}

// Types for query building
export type QueryOptions = {
  columns?: string;
  filter?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  offset?: number;
};

// Extended Supabase client type
export type SupabaseClient = BaseSupabaseClient<Database>;

// Utility types
export type TableName = keyof Tables;
export type ViewName = keyof Views;
export type Row<T extends TableName> = Tables[T]["Row"];
export type Insert<T extends TableName> = Tables[T]["Insert"];
export type Update<T extends TableName> = Tables[T]["Update"];
