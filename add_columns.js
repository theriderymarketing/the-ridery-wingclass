import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { error: e1 } = await supabase.rpc('add_column_if_not_exists', { table_name: 'course_types', column_name: 'shopify_variant_id_journee', data_type: 'text' });
  const { error: e2 } = await supabase.rpc('add_column_if_not_exists', { table_name: 'course_types', column_name: 'shopify_variant_id_annuel', data_type: 'text' });
  
  if (e1 || e2) {
    console.log("RPC might not exist, falling back to REST query if possible or just inform user.");
  }
}
main();
