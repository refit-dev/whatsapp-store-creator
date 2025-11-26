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
          store_mode: "order" | "inquiry" | "hybrid" | null;
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
          interaction_type: "buy_now" | "inquiry" | null;
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
      login_attempts: {
        Row: {
          id: string;
          email: string;
          ip_address: string | null;
          user_agent: string | null;
          attempt_time: string;
          success: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          ip_address?: string | null;
          user_agent?: string | null;
          attempt_time?: string;
          success?: boolean;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["login_attempts"]["Row"]>;
      };
      api_requests: {
        Row: {
          id: string;
          user_id: string | null;
          ip_address: string | null;
          endpoint: string;
          method: string;
          user_agent: string | null;
          request_time: string;
          response_status: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          ip_address?: string | null;
          endpoint: string;
          method: string;
          user_agent?: string | null;
          request_time?: string;
          response_status?: number | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["api_requests"]["Row"]>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          parent_id: string | null;
          level: number;
          sort_order: number | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          parent_id?: string | null;
          level?: number;
          sort_order?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
      };
      store_categories: {
        Row: {
          id: string;
          store_id: string;
          category_id: string;
          is_primary: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          store_id: string;
          category_id: string;
          is_primary?: boolean | null;
          created_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["store_categories"]["Row"]
        >;
      };
      trial_settings: {
        Row: {
          id: string;
          default_trial_days: number;
          auto_extend_active_users: boolean | null;
          auto_extend_days: number | null;
          min_activity_threshold: number | null;
          is_active: boolean | null;
          updated_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          default_trial_days?: number;
          auto_extend_active_users?: boolean | null;
          auto_extend_days?: number | null;
          min_activity_threshold?: number | null;
          is_active?: boolean | null;
          updated_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["trial_settings"]["Row"]>;
      };
      user_trial_overrides: {
        Row: {
          id: string;
          user_id: string;
          trial_days: number;
          reason: string | null;
          applied_by: string | null;
          expires_at: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          trial_days: number;
          reason?: string | null;
          applied_by?: string | null;
          expires_at?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["user_trial_overrides"]["Row"]
        >;
      };
      special_offers: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          offer_type:
            | "percentage_discount"
            | "fixed_amount"
            | "extended_trial"
            | "free_upgrade"
            | "referral_bonus";
          percentage_off: number | null;
          fixed_amount_off: number | null;
          currency: string | null;
          extended_trial_days: number | null;
          free_months: number | null;
          applicable_to: string[] | null;
          target_user_ids: string[] | null;
          target_categories: string[] | null;
          starts_at: string | null;
          ends_at: string | null;
          usage_limit_type: "one_time" | "limited" | "unlimited";
          max_uses: number | null;
          current_uses: number | null;
          max_uses_per_user: number | null;
          is_active: boolean | null;
          is_featured: boolean | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          offer_type:
            | "percentage_discount"
            | "fixed_amount"
            | "extended_trial"
            | "free_upgrade"
            | "referral_bonus";
          percentage_off?: number | null;
          fixed_amount_off?: number | null;
          currency?: string | null;
          extended_trial_days?: number | null;
          free_months?: number | null;
          applicable_to?: string[] | null;
          target_user_ids?: string[] | null;
          target_categories?: string[] | null;
          starts_at?: string | null;
          ends_at?: string | null;
          usage_limit_type?: "one_time" | "limited" | "unlimited";
          max_uses?: number | null;
          current_uses?: number | null;
          max_uses_per_user?: number | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["special_offers"]["Row"]>;
      };
      offer_redemptions: {
        Row: {
          id: string;
          offer_id: string;
          user_id: string;
          discount_applied: number | null;
          trial_days_added: number | null;
          subscription_id: string | null;
          status: "pending" | "applied" | "expired" | "revoked";
          applied_at: string | null;
          expires_at: string | null;
          revenue_impact: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          offer_id: string;
          user_id: string;
          discount_applied?: number | null;
          trial_days_added?: number | null;
          subscription_id?: string | null;
          status?: "pending" | "applied" | "expired" | "revoked";
          applied_at?: string | null;
          expires_at?: string | null;
          revenue_impact?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["offer_redemptions"]["Row"]
        >;
      };
      trial_extension_logs: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          days_added: number;
          reason: string;
          applied_by: string | null;
          previous_end_date: string | null;
          new_end_date: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id?: string | null;
          days_added: number;
          reason: string;
          applied_by?: string | null;
          previous_end_date?: string | null;
          new_end_date?: string | null;
          created_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["trial_extension_logs"]["Row"]
        >;
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          price_cents: number | null;
          currency: string | null;
          interval_type: string | null;
          is_trial: boolean | null;
          razorpay_plan_id: string | null;
          features: Json | null;
          duration_days: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          price_cents?: number | null;
          currency?: string | null;
          interval_type?: string | null;
          is_trial?: boolean | null;
          razorpay_plan_id?: string | null;
          features?: Json | null;
          duration_days?: number | null;
          created_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["subscription_plans"]["Row"]
        >;
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          starts_at: string;
          ends_at: string;
          is_trial: boolean | null;
          payment_provider: string | null;
          payment_id: string | null;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          starts_at: string;
          ends_at: string;
          is_trial?: boolean | null;
          payment_provider?: string | null;
          payment_id?: string | null;
          status?: string | null;
          created_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["user_subscriptions"]["Row"]
        >;
      };
      payment_logs: {
        Row: {
          id: string;
          payment_id: string;
          subscription_id: string | null;
          amount: number;
          currency: string;
          status: string;
          method: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          payment_id: string;
          subscription_id?: string | null;
          amount: number;
          currency?: string;
          status: string;
          method?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payment_logs"]["Row"]>;
      };
      inquiries: {
        Row: {
          id: string;
          store_id: string;
          product_id: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          message: string | null;
          preferred_contact_time: string | null;
          budget_min: number | null;
          budget_max: number | null;
          status:
            | "new"
            | "contacted"
            | "site_visit_scheduled"
            | "negotiating"
            | "converted"
            | "lost";
          priority: "low" | "medium" | "high";
          notes: string | null;
          follow_up_date: string | null;
          assigned_to: string | null;
          converted_at: string | null;
          conversion_value: number | null;
          lost_reason: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          store_id: string;
          product_id?: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          message?: string | null;
          preferred_contact_time?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          status?:
            | "new"
            | "contacted"
            | "site_visit_scheduled"
            | "negotiating"
            | "converted"
            | "lost";
          priority?: "low" | "medium" | "high";
          notes?: string | null;
          follow_up_date?: string | null;
          assigned_to?: string | null;
          converted_at?: string | null;
          conversion_value?: number | null;
          lost_reason?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["inquiries"]["Row"]>;
      };
      inquiry_interactions: {
        Row: {
          id: string;
          inquiry_id: string;
          interaction_type:
            | "status_change"
            | "call"
            | "whatsapp"
            | "email"
            | "site_visit"
            | "meeting"
            | "note";
          notes: string | null;
          previous_status: string | null;
          new_status: string | null;
          created_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          inquiry_id: string;
          interaction_type:
            | "status_change"
            | "call"
            | "whatsapp"
            | "email"
            | "site_visit"
            | "meeting"
            | "note";
          notes?: string | null;
          previous_status?: string | null;
          new_status?: string | null;
          created_by?: string | null;
          created_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["inquiry_interactions"]["Row"]
        >;
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
