/**
 * Razorpay Subscriptions Integration
 * Handles recurring subscription payments with offer discount support
 */

import { razorpay } from "./razorpay";

export interface RazorpayPlan {
  id: string;
  entity: "plan";
  interval: number;
  period: "daily" | "weekly" | "monthly" | "yearly";
  item: {
    id: string;
    active: boolean;
    name: string;
    description: string;
    amount: number;
    currency: string;
  };
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpaySubscription {
  id: string;
  entity: "subscription";
  plan_id: string;
  customer_id?: string;
  status:
    | "created"
    | "authenticated"
    | "active"
    | "pending"
    | "halted"
    | "cancelled"
    | "completed"
    | "expired";
  current_start?: number;
  current_end?: number;
  ended_at?: number | null;
  quantity: number;
  notes: Record<string, string>;
  charge_at?: number;
  start_at?: number;
  end_at?: number;
  auth_attempts: number;
  total_count: number;
  paid_count: number;
  customer_notify: number;
  created_at: number;
  expire_by?: number | null;
  short_url: string;
  has_scheduled_changes: boolean;
  change_scheduled_at?: number | null;
  offer_id?: string | null;
}

export interface CreateSubscriptionParams {
  plan_id: string;
  customer_notify?: 0 | 1;
  quantity?: number;
  start_at?: number;
  expire_by?: number;
  addons?: Array<{
    item: {
      name: string;
      amount: number;
      currency: string;
    };
  }>;
  notes?: Record<string, string>;
  notify_info?: {
    notify_phone?: string;
    notify_email?: string;
  };
  offer_id?: string;
}

/**
 * Create a subscription plan in Razorpay
 */
export async function createRazorpayPlan(params: {
  period: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  amount: number; // Amount in paise (₹299 = 29900)
  currency: string;
  name: string;
  description?: string;
  notes?: Record<string, string>;
}): Promise<RazorpayPlan> {
  try {
    const plan = await razorpay.plans.create({
      period: params.period,
      interval: params.interval,
      item: {
        name: params.name,
        description: params.description || "",
        amount: params.amount,
        currency: params.currency,
      },
      notes: params.notes || {},
    });

    return plan as RazorpayPlan;
  } catch (error: any) {
    console.error("Error creating Razorpay plan:", error);
    throw new Error(`Failed to create plan: ${error.message}`);
  }
}

/**
 * Get all plans from Razorpay
 */
export async function getRazorpayPlans(): Promise<RazorpayPlan[]> {
  try {
    const response = await razorpay.plans.all();
    return response.items as RazorpayPlan[];
  } catch (error: any) {
    console.error("Error fetching Razorpay plans:", error);
    throw new Error(`Failed to fetch plans: ${error.message}`);
  }
}

/**
 * Fetch a single plan from Razorpay
 */
export async function getRazorpayPlan(
  planId: string
): Promise<RazorpayPlan | null> {
  try {
    const plan = await razorpay.plans.fetch(planId);
    return plan as RazorpayPlan;
  } catch (error: any) {
    console.error("Error fetching Razorpay plan:", error);
    return null;
  }
}

/**
 * Create a subscription for a customer with optional offer discount
 */
export async function createRazorpaySubscription(
  params: CreateSubscriptionParams
): Promise<RazorpaySubscription> {
  try {
    const subscriptionData: any = {
      plan_id: params.plan_id,
      customer_notify: params.customer_notify ?? 1,
      quantity: params.quantity || 1,
      total_count: 120, // 120 months = 10 years (Razorpay requires at least 1)
      notes: params.notes || {},
    };

    // Add optional parameters
    if (params.start_at) {
      subscriptionData.start_at = params.start_at;
    }

    if (params.expire_by) {
      subscriptionData.expire_by = params.expire_by;
    }

    if (params.addons && params.addons.length > 0) {
      subscriptionData.addons = params.addons;
    }

    if (params.notify_info) {
      subscriptionData.notify_info = params.notify_info;
    }

    // If offer is provided, add it to notes
    if (params.offer_id) {
      subscriptionData.offer_id = params.offer_id;
    }

    const subscription = await razorpay.subscriptions.create(subscriptionData);

    return subscription as RazorpaySubscription;
  } catch (error: any) {
    console.error("Error creating Razorpay subscription:", error);
    throw new Error(`Failed to create subscription: ${error.message}`);
  }
}

/**
 * Get subscription details
 */
export async function getRazorpaySubscription(
  subscriptionId: string
): Promise<RazorpaySubscription> {
  try {
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    return subscription as RazorpaySubscription;
  } catch (error: any) {
    console.error("Error fetching subscription:", error);
    throw new Error(`Failed to fetch subscription: ${error.message}`);
  }
}

/**
 * Cancel a subscription
 */
export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtCycleEnd: boolean = false
): Promise<RazorpaySubscription> {
  try {
    const subscription = await razorpay.subscriptions.cancel(
      subscriptionId,
      cancelAtCycleEnd
    );
    return subscription as RazorpaySubscription;
  } catch (error: any) {
    console.error("Error cancelling subscription:", error);
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
}

/**
 * Pause a subscription
 */
export async function pauseRazorpaySubscription(
  subscriptionId: string,
  pauseAt: "now" | number = "now"
): Promise<RazorpaySubscription> {
  try {
    const subscription = await razorpay.subscriptions.pause(subscriptionId, {
      pause_at: pauseAt as any,
    });
    return subscription as RazorpaySubscription;
  } catch (error: any) {
    console.error("Error pausing subscription:", error);
    throw new Error(`Failed to pause subscription: ${error.message}`);
  }
}

/**
 * Resume a paused subscription
 */
export async function resumeRazorpaySubscription(
  subscriptionId: string,
  resumeAt: "now" | number = "now"
): Promise<RazorpaySubscription> {
  try {
    const subscription = await razorpay.subscriptions.resume(subscriptionId, {
      resume_at: resumeAt as any,
    });
    return subscription as RazorpaySubscription;
  } catch (error: any) {
    console.error("Error resuming subscription:", error);
    throw new Error(`Failed to resume subscription: ${error.message}`);
  }
}

/**
 * Update subscription (e.g., change plan, update quantity)
 */
export async function updateRazorpaySubscription(
  subscriptionId: string,
  updates: {
    plan_id?: string;
    quantity?: number;
    schedule_change_at?: "now" | "cycle_end";
  }
): Promise<RazorpaySubscription> {
  try {
    const subscription = await razorpay.subscriptions.update(
      subscriptionId,
      updates
    );
    return subscription as RazorpaySubscription;
  } catch (error: any) {
    console.error("Error updating subscription:", error);
    throw new Error(`Failed to update subscription: ${error.message}`);
  }
}

/**
 * Calculate discounted amount based on offer
 */
export function calculateDiscountedAmount(
  originalAmount: number,
  offerType: string,
  offerValue: number
): number {
  switch (offerType) {
    case "percentage":
      return Math.round(originalAmount * (1 - offerValue / 100));
    case "fixed_amount":
      return Math.max(0, originalAmount - offerValue);
    case "trial_extension":
      // For trial extensions, return original amount (no discount on price)
      return originalAmount;
    default:
      return originalAmount;
  }
}
