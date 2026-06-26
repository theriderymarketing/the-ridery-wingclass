import { NextResponse } from 'next/server';
import { fetchShopifyCustomers } from '../../../../lib/shopify';
import { verifyAdmin } from '../verify-admin';

export async function GET(req) {
  const adminCheck = await verifyAdmin(req);
  if (adminCheck?.error) return NextResponse.json(adminCheck, { status: adminCheck.status });

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('q') || '';
    const cursor = url.searchParams.get('cursor') || null;
    const result = await fetchShopifyCustomers(search, cursor);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
