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

    // Optionnel: Vérification de signature Shopify
    // const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    // const hash = crypto.createHmac('sha256', secret).update(rawBody, 'utf8', 'hex').digest('base64');
    // if (hash !== hmacHeader) return new NextResponse('Unauthorized', { status: 401 });

    const order = JSON.parse(rawBody);
    console.log(`[Webhook Shopify] Nouvelle commande reçue: ${order.id}`);

    const customer = order.customer;
    if (!customer) {
      return NextResponse.json({ message: 'No customer data' });
    }

    // 1. Chercher ou créer le client dans Supabase
    let { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('email', customer.email)
      .single();

    if (!existingCustomer) {
      const { data: newCustomer, error: createError } = await supabaseAdmin
        .from('customers')
        .insert([{
          first_name: customer.first_name || '',
          last_name: customer.last_name || '',
          email: customer.email,
          phone: customer.phone || '',
        }])
        .select('id')
        .single();
      
      if (createError) throw createError;
      existingCustomer = newCustomer;
    }

    const customerId = existingCustomer.id;

    // 2. Analyser les articles pour trouver des cours
    const creditsToAdd = [];
    
    // On va chercher tous les types de cours pour matcher les IDs
    const { data: courseTypes } = await supabaseAdmin.from('course_types').select('*');

    for (const item of order.line_items) {
      const title = item.title;
      // Simplification : si le titre contient "Wingboost" ou "Cours"
      if (title.toLowerCase().includes('wingboost')) {
        const type = courseTypes?.find(c => c.name.toLowerCase().includes('wingboost'));
        if (type) {
          creditsToAdd.push({
            customer_id: customerId,
            course_type_id: type.id,
            credits_total: item.quantity, // Par exemple: 1 achat = 1 crédit. S'il s'agit d'un pack de 10, multiplier ici.
            shopify_order_id: order.id.toString(),
            credits_used: 0
          });
        }
      } else if (title.toLowerCase().includes('cours')) {
        // Logique similaire pour les cours unitaires
        const type = courseTypes?.find(c => c.name.toLowerCase().includes('débutant')); // à adapter
        if (type) {
          creditsToAdd.push({
            customer_id: customerId,
            course_type_id: type.id,
            credits_total: item.quantity,
            shopify_order_id: order.id.toString(),
            credits_used: 0
          });
        }
      }
    }

    // 3. Insérer les crédits
    if (creditsToAdd.length > 0) {
      const { error: creditError } = await supabaseAdmin
        .from('student_credits')
        .insert(creditsToAdd);
      
      if (creditError) {
        console.error("Erreur insertion crédits:", creditError);
        throw creditError;
      }
      console.log(`[Webhook Shopify] ${creditsToAdd.length} crédits ajoutés pour ${customer.email}`);
    } else {
      console.log(`[Webhook Shopify] Aucun article de type cours trouvé dans la commande ${order.id}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
