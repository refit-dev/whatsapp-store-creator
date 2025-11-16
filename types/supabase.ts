// Minimal Supabase Database types used by createClient generics
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; created_at: string | null };
        Insert: { id?: string; email: string; created_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      stores: {
        Row: {
          id: string;
          owner_id: string | null;
          handle: string;
          name: string;
          logo_url: string | null;
          banner_url: string | null;
          whatsapp_e164: string;
          currency: string;
          is_payments_enabled: boolean | null;
          payment_provider: "none" | "stripe" | "razorpay" | null;
          is_active: boolean | null;
          approval_status: "pending" | "approved" | "rejected" | null;
          rejection_reason: string | null;
          approved_at: string | null;
          approved_by: string | null;
          is_blocked: boolean | null;
          blocked_at: string | null;
          blocked_by: string | null;
          block_reason: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["stores"]["Row"]> & {
          handle: string;
          name: string;
          whatsapp_e164: string;
          currency: string;
        };
        Update: Partial<Database["public"]["Tables"]["stores"]["Row"]>;
      };
      image_reviews: {
        Row: {
          id: string;
          product_id: string;
          store_id: string;
          image_url: string;
          review_status: "pending" | "approved" | "flagged" | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          flag_reason: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          store_id: string;
          image_url: string;
          review_status?: "pending" | "approved" | "flagged" | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          flag_reason?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["image_reviews"]["Row"]>;
      };
      admins: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          created_at: string | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          created_at?: string | null;
          is_active?: boolean | null;
        };
        Update: Partial<Database["public"]["Tables"]["admins"]["Row"]>;
      };
      products: {
        Row: {
          id: string;
          store_id: string | null;
          title: string;
          description: string | null;
          price_cents: number;
          currency: string;
          image_urls: string[] | null;
          variants: Json | null;
          is_active: boolean | null;
          stock_qty: number | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          title: string;
          price_cents: number;
          currency: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
      };
      orders: {
        Row: {
          id: string;
          store_id: string | null;
          buyer_name: string;
          buyer_phone: string;
          buyer_address: string;
          items: Json;
          subtotal_cents: number;
          discount_cents: number | null;
          total_cents: number;
          payment_link_url: string | null;
          status: "created" | "opened_whatsapp" | "paid" | "cancelled" | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          store_id: string;
          buyer_name: string;
          buyer_phone: string;
          buyer_address: string;
          items: Json;
          subtotal_cents: number;
          total_cents: number;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
      };
      store_members: {
        Row: { store_id: string; user_id: string; role: "owner" | "admin" };
        Insert: { store_id: string; user_id: string; role: "owner" | "admin" };
        Update: Partial<Database["public"]["Tables"]["store_members"]["Row"]>;
      };
      order_events: {
        Row: {
          id: string;
          order_id: string;
          event: string;
          created_at: string | null;
        };
        Insert: { order_id: string; event: string; created_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["order_events"]["Row"]>;
      };
    };
    Views: {
      store_public: {
        Row: {
          id: string;
          handle: string;
          name: string;
          logo_url: string | null;
          banner_url: string | null;
          currency: string;
        };
      };
    };
  };
}
