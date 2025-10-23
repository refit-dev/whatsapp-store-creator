import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a store
    const { data: existingStores } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1);

    if (existingStores && existingStores.length > 0) {
      return NextResponse.json({ 
        message: 'Store already exists',
        storeId: existingStores[0].id 
      });
    }

    // Parse request body for custom store name (optional)
    const body = await request.json().catch(() => ({}));
    const customName = body.storeName;

    // Create default store
    const storeName = customName || `My Store`;
    const handle = `store-${user.id.substring(0, 8)}`;

    type StoreInsert = Database['public']['Tables']['stores']['Insert'];
    const storeData: StoreInsert = {
      owner_id: user.id,
      handle,
      name: storeName,
      whatsapp_e164: '',
      currency: 'USD',
    };

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert(storeData)
      .select()
      .single();

    if (storeError) {
      console.error('Store creation error:', storeError);
      return NextResponse.json({ error: storeError.message }, { status: 500 });
    }

    // Add user as store owner in store_members
    type MemberInsert = Database['public']['Tables']['store_members']['Insert'];
    const memberData: MemberInsert = {
      store_id: store.id,
      user_id: user.id,
      role: 'owner',
    };

    const { error: memberError } = await supabase
      .from('store_members')
      .insert(memberData);

    if (memberError) {
      console.error('Store member error:', memberError);
      // Don't fail if member creation fails - store is already created
    }

    return NextResponse.json({ 
      success: true,
      store: {
        id: store.id,
        handle: store.handle,
        name: store.name
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Failed to create store' 
    }, { status: 500 });
  }
}
