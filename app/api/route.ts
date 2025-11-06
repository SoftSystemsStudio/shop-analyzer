import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("API route called"); // Step 1: confirm route is hit

    const body = await req.json();
    console.log("Request body:", body);

    const { storeUrl } = body;
    if (!storeUrl) {
      console.log("No storeUrl provided");
      return NextResponse.json({ result: "Please provide a store URL." });
    }

    const prompt = `Analyze this e-commerce store: ${storeUrl}. Give actionable insights.`;

    // Step 2: Call OpenAI API
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

    console.log("OpenAI raw response status:", response.status);

    const data = await response.json();
    console.log("OpenAI response:", JSON.stringify(data, null, 2));

    if (!data?.choices?.length) {
      console.log("No choices returned from OpenAI:", data);
      return NextResponse.json({ result: "No response from AI." });
    }

    return NextResponse.json({ result: data.choices[0].message.content });
  } catch (error) {
    console.error("Error in /api/analyze route:", error);
    return NextResponse.json({ result: "Error analyzing store. Please try again." });
  }
}
