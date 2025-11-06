import { NextResponse } from "next/server";
import fetch from "node-fetch";
import cheerio from "cheerio";

export async function POST(req: Request) {
  try {
    console.log("API route called");

    const { storeUrl } = await req.json();
    if (!storeUrl) {
      return NextResponse.json({ result: "Please provide a store URL." });
    }

    console.log("Fetching store:", storeUrl);
    
    // Fetch public store HTML
    const response = await fetch(storeUrl);
    if (!response.ok) throw new Error(`Failed to fetch store HTML: ${response.status}`);
    const html = await response.text();

    // Load HTML with Cheerio
    const $ = cheerio.load(html);

    // Extract products (Shopify / Etsy patterns may vary)
    const products: { name: string; price: string }[] = [];

    // Shopify example: look for product titles and prices
    $(".product-card, .grid-product").each((i, el) => {
      const name = $(el).find(".product-card__title, .grid-product__title").text().trim();
      const price = $(el).find(".price, .grid-product__price").text().trim();
      if (name) products.push({ name, price });
    });

    // Etsy example fallback
    if (products.length === 0) {
      $("li.wt-list-unstyled").each((i, el) => {
        const name = $(el).find("h3").text().trim();
        const price = $(el).find(".currency-value").text().trim();
        if (name) products.push({ name, price });
      });
    }

    console.log("Extracted products:", products.slice(0, 5));

    // Prepare prompt for OpenAI
    const prompt = `Analyze this e-commerce store and give actionable advice based on these products:\n${products
      .map((p) => `- ${p.name} | ${p.price}`)
      .join("\n")}`;

    // Call OpenAI
    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await openAiResponse.json();
    console.log("OpenAI response:", data);

    const result = data?.choices?.[0]?.message?.content || "No insights returned from AI.";

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error in /api/analyze:", error);
    return NextResponse.json({ result: "Error analyzing store. Please try again." });
  }
}
