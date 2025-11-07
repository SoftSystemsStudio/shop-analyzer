// lib/xano.ts
const XANO_BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:GJMdvvxE';

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
  // Create or get user by Clerk ID
  async findOrCreateUser(clerkId: string, email: string) {
    try {
      // Try to find existing user
      const users = await xanoRequest(`/user?clerk_id=${clerkId}`);
      if (users && users.length > 0) {
        return users[0];
      }
    } catch (err) {
      console.log('User not found, creating new user');
    }

    // Create new user
    return xanoRequest('/user', {
      method: 'POST',
      body: JSON.stringify({
        clerk_id: clerkId,
        email: email,
        plan: 'free'
      }),
    });
  },

  // Create a shop linked to a user
  async createShop(data: { user_id: number; url: string; platform: string; name?: string }) {
    return xanoRequest('/shop', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Save products for a shop
  async saveProducts(shopId: number, products: any[]) {
    const promises = products.slice(0, 50).map(product => // Limit to 50 to avoid timeout
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

  // Save analysis
  async saveAnalysis(data: { shop_id: number; insights: string; product_count: number; avg_price?: string }) {
    return xanoRequest('/analysis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get user's shops
  async getUserShops(userId: number) {
    return xanoRequest(`/shop?user_id=${userId}`);
  },

  // Get shop analyses
  async getShopAnalyses(shopId: number) {
    return xanoRequest(`/analysis?shop_id=${shopId}`);
  },
};