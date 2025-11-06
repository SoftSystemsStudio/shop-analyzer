import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: NextRequest) {
  try {
    console.log('=== Starting analysis ===');
    
    const { storeUrl } = await req.json();
    console.log('Store URL:', storeUrl);

    if (!storeUrl) {
      return NextResponse.json({ error: 'storeUrl is required' }, { status: 400 });
    }

    // DEMO MODE: Use mock data for testing
    if (storeUrl.toLowerCase().includes('demo') || storeUrl.toLowerCase().includes('example')) {
      console.log('Using demo mode');
      return getDemoAnalysis(storeUrl);
    }

    // Try to scrape real store
    console.log('Fetching store...');
    const response = await fetch(storeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    
    if (!response.ok) {
      console.error('Fetch failed:', response.status);
      
      // If blocked, suggest demo mode
      return NextResponse.json({ 
        error: `Unable to access store (${response.status}). Most major stores block automated requests.`,
        suggestion: '💡 Try "demo" or "example" as the URL to see how the analyzer works with sample data!'
      }, { status: 500 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const products: { title: string; url: string; price?: string }[] = [];

    // Scraping logic (keeping your existing code)
    const selectorStrategies = [
      {
        container: '.product-card, .grid-product, .product-item',
        title: '.product-title, .title, h2, h3',
        link: 'a',
        price: '.price, .product-price, .money'
      }
    ];

    for (const strategy of selectorStrategies) {
      $(strategy.container).each((_, el) => {
        const element = $(el);
        const title = element.find(strategy.title).first().text().trim();
        let href = element.find(strategy.link).attr('href') ?? '';

        if (href && !href.startsWith('http')) {
          const baseUrl = new URL(storeUrl).origin;
          href = baseUrl + href;
        }

        const price = element.find(strategy.price).first().text().trim() || undefined;

        if (title && href) {
          products.push({ title, url: href, price });
        }
      });

      if (products.length > 0) break;
    }

    if (products.length === 0) {
      return NextResponse.json({ 
        result: `❌ Could not find products. Most modern stores use JavaScript rendering or block scrapers.

💡 **Try demo mode:** Enter "demo" as the URL to see sample analysis!

**Note:** Real scraping requires advanced tools (Puppeteer) which we'll add next.`
      });
    }

    const analysis = analyzeProducts(products, storeUrl);

    return NextResponse.json({ 
      result: analysis,
      products: products.slice(0, 15),
      totalProducts: products.length 
    });

  } catch (err) {
    console.error('=== ERROR ===', err);
    return NextResponse.json({ 
      error: 'Analysis failed. Try "demo" as the URL to see how it works!'
    }, { status: 500 });
  }
}

// DEMO MODE - Returns realistic sample data
function getDemoAnalysis(storeUrl: string) {
  const demoProducts = [
    { title: "Classic Cotton T-Shirt", url: "https://example.com/product/1", price: "$29.99" },
    { title: "Vintage Denim Jacket", url: "https://example.com/product/2", price: "$89.99" },
    { title: "Leather Crossbody Bag", url: "https://example.com/product/3", price: "$149.99" },
    { title: "Wool Blend Sweater", url: "https://example.com/product/4", price: "$59.99" },
    { title: "Canvas Sneakers", url: "https://example.com/product/5", price: "$69.99" },
    { title: "Silk Scarf", url: "https://example.com/product/6", price: "$39.99" },
    { title: "Stainless Steel Watch", url: "https://example.com/product/7", price: "$199.99" },
    { title: "Organic Cotton Hoodie", url: "https://example.com/product/8", price: "$79.99" },
    { title: "Minimalist Backpack", url: "https://example.com/product/9", price: "$119.99" },
    { title: "Bamboo Sunglasses", url: "https://example.com/product/10", price: "$49.99" },
    { title: "Ceramic Coffee Mug", url: "https://example.com/product/11", price: "$19.99" },
    { title: "Linen Button-Up Shirt", url: "https://example.com/product/12", price: "$54.99" },
    { title: "Running Shorts", url: "https://example.com/product/13", price: "$34.99" },
    { title: "Yoga Mat", url: "https://example.com/product/14", price: "$44.99" },
    { title: "Wireless Earbuds", url: "https://example.com/product/15", price: "$129.99" },
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
✅ All products show clear pricing
💰 Mid-market positioning appeals to broad audience
✅ Price distribution shows good variety

🎯 **Recommendations:**
- Add seasonal collections to drive urgency
- Implement product bundling for higher AOV
- Create loyalty program for repeat customers
- Optimize product images for mobile
- Add customer reviews to build trust

📈 **Action Items:**
1. Launch email capture popup for 10% discount
2. Set up abandoned cart recovery (can recover 20-30% of sales)
3. Create Instagram shoppable posts
4. Implement size guides and fit recommendations
5. Add live chat support

💎 **Pro Tip:** Your mid-range pricing ($50-150) hits the sweet spot for impulse purchases while maintaining perceived quality.

---
✨ **This is demo data. Real scraping coming soon!**
  `.trim();

  return NextResponse.json({
    result: analysis,
    products: demoProducts,
    totalProducts: demoProducts.length,
    isDemo: true
  });
}

function analyzeProducts(products: any[], storeUrl: string) {
  const productCount = products.length;
  
  const prices = products
    .map(p => p.price)
    .filter(Boolean)
    .map(p => parseFloat(p.replace(/[^0-9.]/g, '')))
    .filter(p => !isNaN(p) && p > 0);

  const avgPrice = prices.length > 0 
    ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)
    : 'N/A';

  const minPrice = prices.length > 0 ? Math.min(...prices).toFixed(2) : 'N/A';
  const maxPrice = prices.length > 0 ? Math.max(...prices).toFixed(2) : 'N/A';

  const platform = storeUrl.includes('shopify') || storeUrl.includes('.myshopify.com') 
    ? 'Shopify' 
    : storeUrl.includes('etsy.com') 
    ? 'Etsy' 
    : 'Unknown';

  const avgPriceNum = parseFloat(avgPrice);
  const pricingTier = avgPriceNum > 100 ? 'Premium' : avgPriceNum > 50 ? 'Mid-range' : 'Budget-friendly';

  return `
🛍️ **Store Analysis Report**

📊 **Overview:**
- Platform: ${platform}
- Total Products: ${productCount}
- Price Range: $${minPrice} - $${maxPrice}
- Average Price: $${avgPrice}
- Strategy: ${pricingTier}

💡 **Insights:**
${productCount > 50 ? '✅ Large catalog' : '⚠️ Small catalog'}
${prices.length > 0 ? `✅ ${prices.length} products with pricing` : '⚠️ No pricing visible'}
${avgPriceNum > 100 ? '💎 Premium positioning' : '💰 Value pricing'}

🎯 **Recommendations:**
- Expand product catalog
- Add customer reviews
- Implement email marketing
- Optimize for mobile

📈 **Next Steps:**
1. Review top categories
2. Improve SEO
3. Launch social campaigns
  `.trim();
}