import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { storeUrl } = await req.json();
    if (!storeUrl) return NextResponse.json({ result: "Provide a store URL." });

    const prompt = `Analyze this e-commerce store: ${storeUrl}. Give actionable insights.`;

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
    console.log("OpenAI response:", JSON.stringify(data, null, 2));

    if (!data.choices) {
      return NextResponse.json({ result: "AI returned no choices. Check API key." });
    }

    return NextResponse.json({ result: data.choices[0].message.content });
  } catch (err) {
    console.error("Error in /api/analyze:", err);
    return NextResponse.json({ result: "Error analyzing store. See server logs." });
  }
}
