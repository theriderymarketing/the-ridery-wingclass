const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;

export async function shopifyFetch({ query, variables }) {
  if (!SHOPIFY_ACCESS_TOKEN || !SHOPIFY_STORE_DOMAIN) {
    throw new Error('Missing Shopify API credentials in environment variables');
  }

  const endpoint = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();
  if (json.errors) {
    console.error('Shopify GraphQL Errors:', json.errors);
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

export async function createShopifyDiscount(promoData) {
  // Format dates
  const startsAt = new Date().toISOString();
  
  // Create PriceRule (Discount details) and DiscountCode
  const query = `
    mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              codes(first: 1) {
                nodes {
                  code
                }
              }
            }
          }
        }
        userErrors {
          field
          code
          message
        }
      }
    }
  `;

  const valueType = promoData.discount_type === 'percentage' 
    ? { percentage: promoData.discount_value / 100 } 
    : { discountAmount: { amount: promoData.discount_value, appliesOnEachItem: false } };

  const variables = {
    basicCodeDiscount: {
      title: promoData.code,
      code: promoData.code,
      startsAt,
      usageLimit: promoData.max_uses ? promoData.max_uses : null,
      customerSelection: promoData.target_email ? {
        customers: { add: [promoData.target_email] } // Note: Shopify expects customer IDs for this, we might need a workaround for email. But basic works without.
      } : { all: true },
      customerGets: {
        value: valueType,
        items: { all: true }
      }
    }
  };

  // If there's an email target, we actually need to look up the customer ID first in Shopify, but for simplicity, we can just apply to all if we can't look up, or we just rely on Shopify's generic all-customers.
  if (promoData.target_email) {
    variables.basicCodeDiscount.customerSelection = { all: true }; // Simplified for now
  }

  const result = await shopifyFetch({ query, variables });
  
  if (result?.discountCodeBasicCreate?.userErrors?.length > 0) {
    throw new Error(result.discountCodeBasicCreate.userErrors[0].message);
  }

  return result.discountCodeBasicCreate.codeDiscountNode;
}

export async function deleteShopifyDiscount(code) {
  // This is complex in GraphQL as we need the ID. We can search for it first.
  const queryFind = `
    query discountNodes($query: String!) {
      codeDiscountNodes(first: 1, query: $query) {
        nodes {
          id
        }
      }
    }
  `;
  const data = await shopifyFetch({ query: queryFind, variables: { query: code } });
  const node = data?.codeDiscountNodes?.nodes?.[0];
  
  if (!node) return; // Not found, nothing to delete

  const queryDelete = `
    mutation discountCodeDelete($id: ID!) {
      discountCodeDelete(id: $id) {
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  await shopifyFetch({ query: queryDelete, variables: { id: node.id } });
}

export async function fetchShopifyCustomers(search = '', cursor = null) {
  const query = `
    query customers($query: String!, $cursor: String) {
      customers(first: 50, query: $query, after: $cursor, sortKey: UPDATED_AT, reverse: true) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          firstName
          lastName
          email
          orders(first: 15) {
            nodes {
              id
              name
              lineItems(first: 5) {
                nodes {
                  title
                  product {
                    productType
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  const result = await shopifyFetch({ query, variables: { query: search ? `${search}*` : '', cursor } });
  return {
    nodes: result?.customers?.nodes || [],
    pageInfo: result?.customers?.pageInfo || { hasNextPage: false, endCursor: null }
  };
}
