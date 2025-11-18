// Helper functions for managing store categories

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Save categories for a store
 * @param storeId - The store ID
 * @param categoryIds - Array of category IDs to assign
 * @param primaryCategoryId - The primary category ID (optional)
 */
export async function saveStoreCategories(
  storeId: string,
  categoryIds: string[],
  primaryCategoryId?: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // First, remove all existing categories for this store
    await supabase
      .from('store_categories')
      .delete()
      .eq('store_id', storeId);

    // Insert new categories
    type StoreCategoryInsert = Database['public']['Tables']['store_categories']['Insert'];
    const insertData: StoreCategoryInsert[] = categoryIds.map((categoryId) => ({
      store_id: storeId,
      category_id: categoryId,
      is_primary: categoryId === primaryCategoryId || (primaryCategoryId === undefined && categoryIds[0] === categoryId),
    }));

    const { data, error } = await supabase
      .from('store_categories')
      .insert(insertData as any) // Type cast due to Supabase type inference issue
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error saving store categories:', error);
    return { success: false, error };
  }
}

/**
 * Get categories for a store
 * @param storeId - The store ID
 */
export async function getStoreCategories(storeId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  try {
    const { data, error } = await supabase
      .from('store_categories')
      .select(`
        id,
        category_id,
        is_primary,
        categories (
          id,
          name,
          slug,
          description,
          icon,
          level,
          parent_id
        )
      `)
      .eq('store_id', storeId);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching store categories:', error);
    return { success: false, error };
  }
}
