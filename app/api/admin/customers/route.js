import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin } from '../verify-admin';

export async function POST(req) {
  const adminCheck = await verifyAdmin(req);
  if (adminCheck?.error) return Response.json(adminCheck, { status: adminCheck.status });

  try {
    const customerData = await req.json();

    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert([customerData])
      .select()
      .single();

    if (error) throw error;
    return Response.json({ data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
