import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Mapping entre le nom du produit Shopify et l'ID du type de cours dans Supabase
// (Ces IDs devront être adaptés avec ceux générés dans course_types)
const COURSE_MAPPING = {
  'Wingboost': 'Wingboost',
  'Cours Débutant': 'Débutant',
  'Cours Perfectionnement': 'Perfectionnement'
};

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('X-Shopify-Hmac-Sha256');

    // Vérification de signature Shopify OBLIGATOIRE (Red Team Security)
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!secret || !hmacHeader) {
      return new NextResponse('Unauthorized: Missing signature or secret', { status: 401 });
    }
    const hash = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
    if (hash !== hmacHeader) {
      console.error('[SECURITY] Invalid Shopify Webhook signature in Wingclass!');
      return new NextResponse('Unauthorized: Invalid Signature', { status: 401 });
    }

    const order = JSON.parse(rawBody);
    console.log(`[Webhook Shopify] Nouvelle commande payée: ${order.id}`);

    // Récupérer les attributs passés dans l'URL du panier (cart permalink)
    const noteAttributes = order.note_attributes || [];
    let sessionId = null;
    let customerId = null;

    noteAttributes.forEach(attr => {
      if (attr.name === '_session_id') sessionId = attr.value;
      if (attr.name === '_customer_id') customerId = attr.value;
    });

    if (!sessionId || !customerId) {
      console.log(`[Webhook Shopify] Commande ${order.id} ignorée: pas de session_id ou customer_id. Ce n'est pas une réservation via le widget.`);
      return NextResponse.json({ message: 'Not a widget booking' });
    }

    // Inscrire l'élève au créneau
    const { error: enrollError } = await supabaseAdmin
      .from('session_participants')
      .insert([{
        session_id: sessionId,
        customer_id: customerId,
        status: 'booked'
      }]);

    if (enrollError) {
      if (enrollError.code === '23505') {
        console.log(`[Webhook Shopify] Le client ${customerId} est déjà inscrit au créneau ${sessionId}`);
      } else {
        console.error("Erreur insertion session_participants:", enrollError);
        throw enrollError;
      }
    } else {
      console.log(`[Webhook Shopify] Réservation validée pour client ${customerId} au créneau ${sessionId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
