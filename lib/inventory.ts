import { createServerClient } from "./db";
import type { Database } from "@/types/supabase";

type OrderItem = {
  productId: string;
  title: string;
  priceCents: number;
  qty: number;
};

/**
 * Check if there's enough stock for all items in the order
 * Returns an object with success status and error message if any
 */
export async function checkStockAvailability(
  items: OrderItem[]
): Promise<{ success: boolean; message?: string }> {
  const supabase = createServerClient();

  for (const item of items) {
    const { data: product, error } = await supabase
      .from("products")
      .select("id, title, stock_qty")
      .eq("id", item.productId)
      .single();

    if (error || !product) {
      return {
        success: false,
        message: `Product "${item.title}" not found`,
      };
    }

    // If stock_qty is null, it means unlimited stock
    if (product.stock_qty !== null) {
      if (product.stock_qty < item.qty) {
        return {
          success: false,
          message: `Not enough stock for "${product.title}". Available: ${product.stock_qty}, Requested: ${item.qty}`,
        };
      }
    }
  }

  return { success: true };
}

/**
 * Reduce inventory for all items in an order
 * This should be called when an order is confirmed/paid
 */
export async function reduceInventory(
  items: OrderItem[]
): Promise<{ success: boolean; message?: string }> {
  const supabase = createServerClient(true); // Use service role for direct updates

  try {
    for (const item of items) {
      // Get current stock
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("id, title, stock_qty")
        .eq("id", item.productId)
        .single();

      if (fetchError || !product) {
        console.error(`Product ${item.productId} not found:`, fetchError);
        continue; // Skip if product not found
      }

      // Skip if stock tracking is disabled (null means unlimited)
      if (product.stock_qty === null) {
        continue;
      }

      // Calculate new stock
      const newStock = Math.max(0, product.stock_qty - item.qty);

      // Update stock
      const { error: updateError } = await supabase
        .from("products")
        .update({
          stock_qty: newStock,
        } as Database["public"]["Tables"]["products"]["Update"])
        .eq("id", item.productId);

      if (updateError) {
        console.error(
          `Failed to update stock for ${item.productId}:`,
          updateError
        );
        return {
          success: false,
          message: `Failed to update inventory for "${product.title}"`,
        };
      }

      console.log(
        `✅ Reduced inventory for "${product.title}": ${product.stock_qty} → ${newStock}`
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Inventory reduction error:", error);
    return {
      success: false,
      message: "Failed to update inventory",
    };
  }
}

/**
 * Restore inventory for cancelled orders
 */
export async function restoreInventory(
  items: OrderItem[]
): Promise<{ success: boolean; message?: string }> {
  const supabase = createServerClient(true); // Use service role

  try {
    for (const item of items) {
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("id, title, stock_qty")
        .eq("id", item.productId)
        .single();

      if (fetchError || !product) {
        console.error(`Product ${item.productId} not found:`, fetchError);
        continue;
      }

      // Skip if stock tracking is disabled
      if (product.stock_qty === null) {
        continue;
      }

      // Restore stock
      const newStock = product.stock_qty + item.qty;

      const { error: updateError } = await supabase
        .from("products")
        .update({
          stock_qty: newStock,
        } as Database["public"]["Tables"]["products"]["Update"])
        .eq("id", item.productId);

      if (updateError) {
        console.error(
          `Failed to restore stock for ${item.productId}:`,
          updateError
        );
      }

      console.log(
        `♻️ Restored inventory for "${product.title}": ${product.stock_qty} → ${newStock}`
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Inventory restoration error:", error);
    return {
      success: false,
      message: "Failed to restore inventory",
    };
  }
}
