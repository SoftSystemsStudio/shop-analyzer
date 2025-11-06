// lib/xano.ts
const XANO_BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:v1';

export async function xanoRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${XANO_BASE_URL}${endpoint}`;
  
  console.log('Xano request:', url, options);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Xano error:', error);
    throw new Error(`Xano error: ${response.status} - ${error}`);
  }

  return response.json();
}

export const xano = {
  async createShop(data: { url: string; platform: string; name?: string }) {
    return xanoRequest('/shop', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async saveProducts(shopId: number, products: any[]) {
    const promises = products.map(product =>
      xanoRequest('/product', {
        method: 'POST',
        body: JSON.stringify({
          shop_id: shopId,
          title: product.title,
          url: product.url,
          price: product.price,
        }),
      })
    );
    return Promise.all(promises);
  },

  async saveAnalysis(data: { shop_id: number; insights: string; product_count: number; avg_price?: string }) {
    return xanoRequest('/analysis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};