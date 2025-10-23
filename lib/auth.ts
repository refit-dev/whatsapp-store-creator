import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function getUser() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      // If user doesn't exist, return null instead of throwing
      if (error.message.includes('User from sub claim in JWT does not exist')) {
        return null;
      }
      throw error;
    }
    return user;
  } catch (e) {
    console.error('Auth error:', e);
    return null;
  }
}

export async function getUserStores() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
  const { data: stores } = await supabase
    .from('stores')
    .select('*, store_members(role)')
    .order('created_at', { nullsFirst: true });
  return stores;
}

export async function createInitialStore(userId: string, storeName: string) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
  const handle = storeName.toLowerCase().replace(/[^a-z0-9]/g, "-");

  type StoreInsert = Database['public']['Tables']['stores']['Insert'];
  const storeData: StoreInsert = {
    owner_id: userId,
    handle,
    name: storeName,
    whatsapp_e164: "",
    currency: "USD",
  };

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .insert(storeData)
    .select()
    .single();

  if (storeError) throw storeError;

  type MemberInsert = Database['public']['Tables']['store_members']['Insert'];
  const memberData: MemberInsert = {
    store_id: store.id,
    user_id: userId,
    role: "owner",
  };

  const { error: memberError } = await supabase
    .from('store_members')
    .insert(memberData);

  if (memberError) throw memberError;

  return store;
}
