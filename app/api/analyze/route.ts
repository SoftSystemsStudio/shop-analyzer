import { NextRequest, NextResponse } from 'next/server';
import cheerio from 'cheerio';

export async function POST(req: NextRequest) {
  try {
    const { storeUrl } = await req.json();

    // Fetch the Shopify store homepage
    const res = await fetch(storeUrl);
    const html = await res.text();

    const $ = cheerio.load(html);

    // Get store name from <title> tag
    const storeName = $('title').text().trim();

    // Get product names (assuming they are in meta tags or product links)
    const products: string[] = [];
    $('a[href*="/products/"]').each((i, el) => {
      const productName = $(el).text().trim();
      if (productName) products.push(productName);
    });

    return NextResponse.json({
      storeName,
      products: Array.from(new Set(products)), // remove duplicates
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message });
  }
}
