const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;

async function shopifyFetch({ query }) {
  const endpoint = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query }),
  });
  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

async function fetchAllShopifyCustomers() {
  let hasNextPage = true;
  let cursor = null;
  const allShopifyCustomers = [];

  while (hasNextPage) {
    const query = `
      {
        customers(first: 250${cursor ? `, after: "${cursor}"` : ''}) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            firstName
            lastName
            email
            phone
            defaultAddress {
              formatted
            }
          }
        }
      }
    `;
    const data = await shopifyFetch({ query });
    const customers = data.customers.nodes;
    allShopifyCustomers.push(...customers);
    hasNextPage = data.customers.pageInfo.hasNextPage;
    cursor = data.customers.pageInfo.endCursor;
    console.log(`Fetched ${allShopifyCustomers.length} customers so far...`);
  }
  return allShopifyCustomers;
}

async function run() {
  console.log('Fetching all customers from Shopify...');
  const allShopifyCustomers = await fetchAllShopifyCustomers();
  console.log(`Total Shopify customers fetched: ${allShopifyCustomers.length}`);

  let inserted = 0;
  let updated = 0;

  for (const sc of allShopifyCustomers) {
    if (!sc.email) continue;
    
    const email = sc.email.toLowerCase();
    const phone = sc.phone || '';
    const address = sc.defaultAddress ? sc.defaultAddress.formatted.join(', ') : '';
    const firstName = sc.firstName || '';
    const lastName = sc.lastName || '';

    const { data: existing } = await supabaseAdmin.from('customers').select('*').eq('email', email).maybeSingle();

    if (existing) {
       let needsUpdate = false;
       const updateData = {};
       
       if (!existing.phone && phone) { updateData.phone = phone; needsUpdate = true; }
       if (!existing.address && address) { updateData.address = address; needsUpdate = true; }
       if (!existing.first_name && firstName) { updateData.first_name = firstName; needsUpdate = true; }
       if (!existing.last_name && lastName) { updateData.last_name = lastName; needsUpdate = true; }

       if (needsUpdate) {
          await supabaseAdmin.from('customers').update(updateData).eq('id', existing.id);
          updated++;
       }
    } else {
       await supabaseAdmin.from('customers').insert([{
          id: crypto.randomUUID(),
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          address
       }]);
       inserted++;
    }
  }

  console.log(`Done! Inserted ${inserted} new customers from Shopify, and updated ${updated} existing ones with missing Shopify info.`);
}

run().catch(console.error);
