import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { storeUrl } = await req.json();

    if (!storeUrl) {
      console.error("No store URL provided.");
      return NextResponse.json({ result: "Please provide a store URL." });
    }

    const prompt = `Analyze this e-commerce store: ${storeUrl}. Give actionable marketing, design, and SEO insights.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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

    const data = await response.json();
    console.log("AI Response:", JSON.stringify(data, null, 2));

    if (!data?.choices?.length) {
      console.error("No choices in AI response:", data);
      return NextResponse.json({ result: "No response from AI." });
    }

    return NextResponse.json({ result: data.choices[0].message.content });
  } catch (error) {
    console.error("Error in /api/analyze route:", error);
    return NextResponse.json({ result: "Error analyzing store." });
  }
}
