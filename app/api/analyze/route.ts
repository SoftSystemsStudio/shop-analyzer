import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { auth } from '@clerk/nextjs/server';
import { saveToXano } from '@/lib/xano'; // ensure this path is correct

export async function POST(req: NextRequest) {
  try {
    console.log('=== Starting analysis ===');

    const { storeUrl } = await req.json();
    console.log('Store URL:', storeUrl);

    if (!storeUrl) {
      return NextResponse.json({ error: 'storeUrl is required' }, { status: 400 });
    }

    // Get authenticated user
    const { userId } = await auth();
    console.log('User ID from Clerk:', userId);

    // DEMO MODE
    if (storeUrl.toLowerCase().includes('demo') || storeUrl.toLowerCase().includes('example')) {
      console.log('Using demo mode');
      const demoResult = getDemoAnalysis(storeUrl);

      console.log('Saving demo result to Xano...');
      console.log('Xano URL is:', process.env.XANO_URL);

      const xanoRes = await saveToXano({
        shop_id: userId, // string now OK since Xano accepts text
        store_url: storeUrl,
        store_name: extractStoreName(storeUrl),
        platform: 'demo',
        insights: demoResult.analysisData.insights,
        product_count: demoResult.analysisData.productCount,
        avg_price: demoResult.analysisData.avgPrice,
        products: demoResult.analysisData.products,
      });

      console.log('Xano response:', xanoRes);

      return NextResponse.json(demoResult);
    }

    console.log('Fetching store...');
    const response = await fetch(storeUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });

    if (!response.ok) {
      console.error('Fetch failed:', response.status);
      return NextResponse.json(
        {
          error: `Unable to access store (${response.status}).`,
          suggestion: '💡 Try "demo" as the URL to see how it works!',
        },
        { status: 500 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const products: { title: string; url: string; price?: string }[] = [];

    $('.product-card, .grid-product, .product-item').each((_, el) => {
      const element = $(el);
      const title = element.find('.product-title, .title, h2, h3').first().text().trim();
      let href = element.find('a').attr('href') ?? '';

      if (href && !href.startsWith('http')) {
        const baseUrl = new URL(storeUrl).origin;
        href = baseUrl + href;
      }

      const price =
        element.find('.price, .product-price, .money').first().text().trim() || undefined;

      if (title && href) {
        products.push({ title, url: href, price });
      }
    });

    if (products.length === 0) {
      return NextResponse.json({
        result: `❌ Could not find products. Try "demo" to see how it works!`,
      });
    }

    const analysis = analyzeProducts(products, storeUrl);

    const analysisData = {
      storeUrl,
      storeName: extractStoreName(storeUrl),
      platform: storeUrl.includes('shopify') ? 'shopify' : 'etsy',
      insights: analysis,
      productCount: products.length,
      avgPrice: calculateAvgPrice(products) || 'N/A',
      products: products.slice(0, 15),
    };

    console.log('Saving real store analysis to Xano...');
    const xanoRes = await saveToXano({
      shop_id: userId,
      store_url: storeUrl,
      store_name: extractStoreName(storeUrl),
      platform: analysisData.platform,
      insights: analysisData.insights,
      product_count: analysisData.productCount,
      avg_price: analysisData.avgPrice,
      products: analysisData.products,
    });

    console.log('Xano response:', xanoRes);

    return NextResponse.json({
      result: analysis,
      products: products.slice(0, 15),
      totalProducts: products.length,
      shouldSave: true,
      analysisData,
    });
  } catch (err) {
    console.error('=== ERROR ===', err);
    return NextResponse.json(
      {
        error: 'Analysis failed. Try "demo" to see how it works!',
      },
      { status: 500 }
    );
  }
}

// DEMO ANALYSIS
function getDemoAnalysis(storeUrl: string) {
  const demoProducts = [
    { title: 'Classic Cotton T-Shirt', url: 'https://example.com/product/1', price: '$29.99' },
    { title: 'Vintage Denim Jacket', url: 'https://example.com/product/2', price: '$89.99' },
    { title: 'Leather Crossbody Bag', url: 'https://example.com/product/3', price: '$149.99' },
    { title: 'Wool Blend Sweater', url: 'https://example.com/product/4', price: '$59.99' },
    { title: 'Canvas Sneakers', url: 'https://example.com/product/5', price: '$69.99' },
  ];

  const analysis = `
🛍️ **Store Analysis Report** (Demo Mode)

📊 **Overview:**
- Platform: Demo Store
- Total Products: ${demoProducts.length}
- Price Range: $19.99 - $199.99
- Average Price: $78.66
- Strategy: Mid-range

💡 **Insights:**
✅ Good catalog size with diverse product range
✅ Clear pricing on all products
💰 Mid-market positioning appeals to broad audience

🎯 **Recommendations:**
- Add seasonal collections
- Bundle products
- Build loyalty program
- Optimize mobile images
- Add reviews for trust
`.trim();

  return {
    result: analysis,
    products: demoProducts,
    totalProducts: demoProducts.length,
    shouldSave: true,
    analysisData: {
      storeUrl,
      storeName: extractStoreName(storeUrl),
      platform: 'demo',
      insights: analysis,
      productCount: demoProducts.length,
      avgPrice: '78.66',
      products: demoProducts,
    },
  };
}

function analyzeProducts(products: any[], storeUrl: string) {
  const productCount = products.length;
  const prices = products
    .map((p) => p.price)
    .filter(Boolean)
    .map((p) => parseFloat(p.replace(/[^0-9.]/g, '')))
    .filter((p) => !isNaN(p) && p > 0);

  const avgPrice =
    prices.length > 0
      ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)
      : 'N/A';

  const minPrice = prices.length > 0 ? Math.min(...prices).toFixed(2) : 'N/A';
  const maxPrice = prices.length > 0 ? Math.max(...prices).toFixed(2) : 'N/A';

  return `
🛍️ **Store Analysis Report**

📊 **Overview:**
- Total Products: ${productCount}
- Price Range: $${minPrice} - $${maxPrice}
- Average Price: $${avgPrice}

💡 **Insights:**
${productCount > 50 ? '✅ Large catalog' : '⚠️ Limited catalog'}
✅ ${prices.length} products with pricing

🎯 **Recommendations:**
- Expand product catalog
- Add customer reviews
- Implement email marketing
  `.trim();
}

function extractStoreName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '').split('.')[0];
  } catch {
    return 'Unknown Store';
  }
}

function calculateAvgPrice(products: any[]): string | undefined {
  const prices = products
    .map((p) => p.price)
    .filter(Boolean)
    .map((p) => parseFloat(p.replace(/[^0-9.]/g, '')))
    .filter((p) => !isNaN(p));

  if (prices.length === 0) return undefined;
  return (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
}
