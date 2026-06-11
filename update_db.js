import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Updating Cours Mer-Jeu...");
  const { error: e1 } = await supabase.from('course_types')
    .update({
      name: 'Cours (Mer-Jeu)',
      shopify_variant_id: '56311522001227', // Base
      variant_id_journee: '56311521968459', // Journee
      variant_id_annuel: '56311521935691'  // Annuel
    })
    .eq('name', 'Cours'); // It used to be named "Cours"
    
  if (e1) console.error(e1);

  console.log("Inserting Cours Ven-Dim...");
  const { error: e2 } = await supabase.from('course_types')
    .insert([{
      name: 'Cours (Ven-Dim)',
      capacity: 4,
      duration_minutes: 120,
      color: '#F59E0B',
      shopify_variant_id: '56311524622667', // Base
      variant_id_journee: '56311524589899', // Journee
      variant_id_annuel: '56311524557131'  // Annuel
    }]);

  if (e2) console.error(e2);

  const { data } = await supabase.from('course_types').select('*');
  console.log("Updated DB:", data);
}
run();
