import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin } from '../verify-admin';
import crypto from 'crypto';

export async function POST(req) {
  const adminCheck = await verifyAdmin(req);
  if (adminCheck?.error) return Response.json(adminCheck, { status: adminCheck.status });

  try {
    const participantData = await req.json();
    if (!participantData.id) {
      participantData.id = crypto.randomUUID();
    }

    const { data, error } = await supabaseAdmin
      .from('session_participants')
      .insert([participantData])
      .select()
      .single();

    if (error) throw error;

    // Déduction d'un crédit si un pack affilié existe
    try {
      const { data: customer } = await supabaseAdmin
        .from('customers')
        .select('email')
        .eq('id', participantData.customer_id)
        .single();
        
      if (customer?.email) {
        // Ignorer la casse pour la comparaison de l'email
        const { data: promos } = await supabaseAdmin
          .from('promo_codes')
          .select('*');
          
        const validPromo = promos?.filter(p => p.target_email?.toLowerCase() === customer.email.toLowerCase())
                                 .find(p => p.max_uses && p.used_count < p.max_uses);
                                 
        if (validPromo) {
          await supabaseAdmin
            .from('promo_codes')
            .update({ used_count: validPromo.used_count + 1 })
            .eq('id', validPromo.id);
        }
      }
    } catch (promoErr) {
      console.error("Failed to deduct promo code:", promoErr);
    }

    return Response.json({ data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req) {
  const adminCheck = await verifyAdmin(req);
  if (adminCheck?.error) return Response.json(adminCheck, { status: adminCheck.status });

  try {
    const { id } = await req.json();
    if (!id) return Response.json({ error: 'Missing ID' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('session_participants')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
