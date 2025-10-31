import type { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase";

// Core database schema types
export type Schema = Database["public"];
export type Tables = Schema["Tables"];
export type Views = Schema["Views"];

// Table and view types
export type TableName = keyof Tables;
export type ViewName = keyof Views;

// Row types
export type Row<T extends TableName> = Tables[T]["Row"];
export type Insert<T extends TableName> = Tables[T]["Insert"];
export type Update<T extends TableName> = Tables[T]["Update"];
export type ViewRow<T extends ViewName> = Views[T]["Row"];

// Supabase client type
export type SupabaseClient = ReturnType<typeof createClient<Database>>;

// Core table types with relations
export interface Store extends Row<"stores"> {
  orders?: OrderWithRelations[];
  products?: ProductWithRelations[];
  members?: StoreMemberWithRelations[];
  // Payment system fields
  payment_enabled?: boolean;
  payment_method?: string;
  upi_id?: string;
  paytm_number?: string;
  payment_instructions?: string;
}

export interface Order extends Row<"orders"> {
  store?: Store;
  events?: OrderEventWithRelations[];
}

export interface Product extends Row<"products"> {
  store?: Store;
}

export interface StoreMember extends Row<"store_members"> {
  store?: Store;
  user?: User;
}

export interface OrderEvent extends Row<"order_events"> {
  order?: Order;
}

export interface User extends Row<"users"> {
  stores?: Store[];
  memberships?: StoreMember[];
}

// Versions without relations for insert/update
export type OrderWithRelations = Order;
export type ProductWithRelations = Product;
export type StoreMemberWithRelations = StoreMember;
export type OrderEventWithRelations = OrderEvent;

// Public view types
export type StorePublic = ViewRow<"store_public">;

// JSON type helpers
export type Json = Database["public"]["Tables"]["orders"]["Row"]["items"];
export type JsonValue = Json | JsonArray;
export type JsonArray = Json[] | null;

// Database operation types
export type DbResult<T> = {
  data: T | null;
  error: Error | null;
};

// API response types
export type ApiResponse<T> = {
  data: T;
  error: string | null;
};

// Type guards for runtime checks
export function isStore(value: any): value is Store {
  return value?.id && typeof value.id === "string" && "handle" in value;
}

export function isOrder(value: any): value is Order {
  return value?.id && typeof value.id === "string" && "store_id" in value;
}

export function isProduct(value: any): value is Product {
  return value?.id && typeof value.id === "string" && "price_cents" in value;
}

// Helper functions for database operations
export function assertDbResponse<T>(result: DbResult<T>): T {
  if (result.error) throw result.error;
  if (result.data === null) throw new Error("No data returned");
  return result.data;
}

export function assertDbArrayResponse<T>(result: DbResult<T[]>): T[] {
  if (result.error) throw result.error;
  if (!result.data) return [];
  return result.data;
}

export function assertDbSingleResponse<T>(result: DbResult<T[]>): T {
  if (result.error) throw result.error;
  if (!result.data?.length) throw new Error("No data found");
  return result.data[0];
}

export function assertValidInsert<T extends TableName>(
  data: Insert<T>
): Insert<T> {
  // Add runtime validation if needed
  return data;
}

export function assertValidUpdate<T extends TableName>(
  data: Update<T>
): Update<T> {
  // Add runtime validation if needed
  return data;
}
