import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { xano } from '@/lib/xano';

export async function POST(req: NextRequest) {
  try {
    const { storeUrl } = await req.json();

    if (!storeUrl) {
      return NextResponse.json({ error: 'storeUrl is required' }, { status: 400 });
    }

    // Step 1: Scrape products
    const response = await fetch(storeUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const products: { title: string; url: string; price?: string }[] = [];

    $('.product-card, .grid-product, .product-item').each((_, el) => {
      const element = $(el);
      const title = element.find('.product-title, .title, h2, h3').first().text().trim();
      let href = element.find('a').attr('href') ?? '';

      if (!href.startsWith('http')) {
        const baseUrl = new URL(storeUrl).origin;
        href = baseUrl + href;
      }

      const price = element.find('.price, .product-price').first().text().trim() || undefined;

      if (title && href) {
        products.push({ title, url: href, price });
      }
    });

    if (products.length === 0) {
      return NextResponse.json({ 
        result: '❌ Could not find any products. This store might use a different layout or require JavaScript rendering.' 
      });
    }

    // Step 2: Analyze the data
    const analysis = analyzeProducts(products, storeUrl);

    // Step 3: Save to Xano
    const platform = storeUrl.includes('shopify') || storeUrl.includes('.myshopify.com') ? 'shopify' : 'etsy';
    const storeName = extractStoreName(storeUrl);

    try {
      const shop = await xano.createShop({
        url: storeUrl,
        platform,
        name: storeName,
      });
      
      await xano.saveProducts(shop.id, products);
      await xano.saveAnalysis({
        shop_id: shop.id,
        insights: analysis,
        product_count: products.length,
        avg_price: calculateAvgPrice(products),
      });
      
      console.log('✅ Saved to Xano successfully!');
    } catch (xanoError) {
      console.error('⚠️ Xano save failed:', xanoError);
      // Don't fail the whole request if saving fails
    }

    return NextResponse.json({ 
      result: analysis,
      products: products.slice(0, 10), // Return first 10 for display
      totalProducts: products.length 
    });

  } catch (err) {
    console.error('Error in /api/analyze:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Analysis logic
function analyzeProducts(products: any[], storeUrl: string) {
  const productCount = products.length;
  
  // Extract prices and calculate stats
  const prices = products
    .map(p => p.price)
    .filter(Boolean)
    .map(p => parseFloat(p.replace(/[^0-9.]/g, '')))
    .filter(p => !isNaN(p));

  const avgPrice = prices.length > 0 
    ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)
    : 'N/A';

  const minPrice = prices.length > 0 ? Math.min(...prices).toFixed(2) : 'N/A';
  const maxPrice = prices.length > 0 ? Math.max(...prices).toFixed(2) : 'N/A';

  // Detect platform
  const platform = storeUrl.includes('shopify') || storeUrl.includes('.myshopify.com') 
    ? 'Shopify' 
    : storeUrl.includes('etsy.com') 
    ? 'Etsy' 
    : 'Unknown';

  // Generate insights
  return `
🛍️ **Store Analysis Report**

📊 **Overview:**
- Platform: ${platform}
- Total Products Found: ${productCount}
- Price Range: $${minPrice} - $${maxPrice}
- Average Price: $${avgPrice}

💡 **Quick Insights:**
${productCount > 50 ? '✅ Large catalog - good product variety' : '⚠️ Small catalog - consider adding more products'}
${prices.length > 0 ? `✅ ${prices.length} products have pricing info` : '⚠️ No pricing information detected'}
${parseFloat(avgPrice) > 100 ? '💎 Premium pricing strategy' : '💰 Budget-friendly pricing'}

🎯 **Recommendations:**
${productCount < 20 ? '- Add more products to increase customer choice\n' : ''}
${prices.length < productCount * 0.5 ? '- Ensure all products display prices clearly\n' : ''}
- Consider adding product descriptions and images
- Implement SEO best practices for better visibility
- Set up email marketing to engage customers

📈 **Next Steps:**
1. Review top-performing product categories
2. Optimize product titles and descriptions
3. Add customer reviews and testimonials
4. Set up abandoned cart recovery
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
    .map(p => p.price)
    .filter(Boolean)
    .map(p => parseFloat(p.replace(/[^0-9.]/g, '')))
    .filter(p => !isNaN(p));

  if (prices.length === 0) return undefined;
  return (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
}