import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req) {
  try {
    const { session_id, customer } = await req.json();

    if (!session_id || !customer || !customer.email || !customer.first_name || !customer.last_name) {
      return NextResponse.json({ error: "Informations incomplètes" }, { status: 400 });
    }

    // 1. Chercher ou créer le client
    let { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('email', customer.email)
      .single();

    if (!existingCustomer) {
      const { data: newCustomer, error: createError } = await supabaseAdmin
        .from('customers')
        .insert([{
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone || '',
          birth_date: customer.birth_date || null,
          has_license: customer.has_license || false,
          license_paid: customer.license_paid || false,
          license_type: customer.license_type || ''
        }])
        .select()
        .single();
      
      if (createError) throw createError;
      existingCustomer = newCustomer;
    } else {
      // Mettre à jour les infos si nécessaire
      await supabaseAdmin.from('customers').update({
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone || existingCustomer.phone,
        birth_date: customer.birth_date || existingCustomer.birth_date,
        has_license: customer.has_license || existingCustomer.has_license,
        license_paid: customer.license_paid || existingCustomer.license_paid,
        license_type: customer.license_type || existingCustomer.license_type
      }).eq('id', existingCustomer.id);
    }

    // 2. Récupérer la session et les Variant IDs Shopify
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('id, course_type_id, course_types(capacity, shopify_variant_id, variant_id_journee, variant_id_annuel)')
      .eq('id', session_id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });
    }

    // Vérifier les places
    const { count } = await supabaseAdmin
      .from('session_participants')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session_id);
    
    if (count >= (session.course_types?.capacity || 4)) {
      return NextResponse.json({ error: "Ce créneau est déjà complet" }, { status: 400 });
    }

    // Choisir le bon variant ID selon le choix de licence de l'utilisateur
    let variantId = session.course_types?.shopify_variant_id; // par défaut (déjà une licence)

    if (!customer.has_license) {
      if (customer.license_type === 'journee' && session.course_types?.variant_id_journee) {
        variantId = session.course_types.variant_id_journee;
      } else if (customer.license_type === 'annuelle' && session.course_types?.variant_id_annuel) {
        variantId = session.course_types.variant_id_annuel;
      }
    }

    if (!variantId) {
      return NextResponse.json({ error: "Le produit Shopify n'est pas encore configuré pour ce tarif. Veuillez contacter l'école." }, { status: 400 });
    }

    // 3. Générer le lien de paiement Shopify (Cart permalink)
    // Format: https://[shop]/cart/[variant_id]:1?attributes[_session_id]=...&attributes[_customer_id]=...
    const shopifyDomain = "shop-theridery.myshopify.com";
    
    const checkoutUrl = new URL(`https://${shopifyDomain}/cart/${variantId}:1`);
    checkoutUrl.searchParams.append('attributes[_session_id]', session_id);
    checkoutUrl.searchParams.append('attributes[_customer_id]', existingCustomer.id);
    checkoutUrl.searchParams.append('note', `Réservation pour le créneau (Session ID: ${session_id})`);

    return NextResponse.json({ checkoutUrl: checkoutUrl.toString() });

  } catch (error) {
    console.error("[Checkout API Error]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
