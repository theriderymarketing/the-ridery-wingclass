import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { createShopifyDiscount, deleteShopifyDiscount } from '../../../../lib/shopify';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('promo_codes').select('*').eq('type', 'cours').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const promoData = await req.json();
    
    // Create in Shopify first
    try {
      await createShopifyDiscount(promoData);
    } catch(err) {
      console.error("Shopify error:", err);
      // We continue anyway, but maybe we should throw to block creation if Shopify fails
    }

    const { error } = await supabaseAdmin.from('promo_codes').insert([promoData]);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, is_active } = await req.json();
    const { error } = await supabaseAdmin.from('promo_codes').update({ is_active }).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    // First get the code
    const { data: promo } = await supabaseAdmin.from('promo_codes').select('code').eq('id', id).single();
    if (promo) {
      try {
        await deleteShopifyDiscount(promo.code);
      } catch(err) {
        console.error("Shopify delete error:", err);
      }
    }

    const { error } = await supabaseAdmin.from('promo_codes').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
