import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req) {
  try {
    const { session_id, customer_id } = await req.json();

    if (!session_id || !customer_id) {
      return NextResponse.json({ error: "Missing session or customer" }, { status: 400 });
    }

    // 1. Récupérer le type de cours du créneau
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('course_type_id, capacity')
      .eq('id', session_id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });
    }

    // Vérifier s'il reste de la place
    const { count } = await supabaseAdmin
      .from('session_participants')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session_id);
    
    if (count >= session.capacity) {
      return NextResponse.json({ error: "Ce créneau est complet" }, { status: 400 });
    }

    // 2. Vérifier si le client a un crédit valide pour ce type de cours
    const { data: credits } = await supabaseAdmin
      .from('student_credits')
      .select('*')
      .eq('customer_id', customer_id)
      .eq('course_type_id', session.course_type_id);

    const validCredit = credits?.find(c => c.credits_total > c.credits_used);

    if (!validCredit) {
      return NextResponse.json({ error: "Paiement non trouvé ou crédits épuisés. Vous devez acheter ce cours sur Shopify." }, { status: 403 });
    }

    // 3. Inscrire l'élève
    const { data: participant, error: enrollError } = await supabaseAdmin
      .from('session_participants')
      .insert([{
        session_id: session_id,
        customer_id: customer_id,
        status: 'booked'
      }])
      .select()
      .single();

    if (enrollError) {
      if (enrollError.code === '23505') {
        return NextResponse.json({ error: "Vous êtes déjà inscrit à ce cours !" }, { status: 400 });
      }
      throw enrollError;
    }

    // 4. Déduire un crédit
    const { error: updateCreditError } = await supabaseAdmin
      .from('student_credits')
      .update({ credits_used: validCredit.credits_used + 1 })
      .eq('id', validCredit.id);

    if (updateCreditError) {
      console.error("Failed to deduct credit:", updateCreditError);
      // We should ideally rollback the participant insert, but for now we just log it.
    }

    return NextResponse.json({ success: true, participant });

  } catch (error) {
    console.error("[Widget Enroll Error]:", error);
    return NextResponse.json({ error: "Erreur serveur lors de la réservation." }, { status: 500 });
  }
}
