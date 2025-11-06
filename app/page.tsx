"use client";
import { useState } from "react";

export default function Home() {
  const [storeUrl, setStoreUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");

  const analyzeStore = async () => {
    if (!storeUrl) {
      setAnalysis("Please enter a store URL.");
      return;
    }

    setLoading(true);
    setAnalysis("");

    try {
      // Absolute URL approach (works reliably on Vercel)
      const res = await fetch(`${window.location.origin}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeUrl }),
      });

      if (!res.ok) {
        throw new Error("Network response not OK");
      }

      const data = await res.json();
      setAnalysis(data.result || "No response from AI.");
    } catch (err) {
      console.error("Fetch error:", err);
      setAnalysis("Error analyzing store. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        🛍️ Shop Analyzer AI
      </h1>
      <div className="bg-white shadow-md rounded-xl p-6 w-full max-w-md">
        <input
          type="text"
          value={storeUrl}
          onChange={(e) => setStoreUrl(e.target.value)}
          placeholder="Enter your Shopify or Etsy store link"
          className="border w-full p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="button" // ensures the page doesn’t reload
          onClick={analyzeStore}
          disabled={loading}
          className="bg-indigo-600 text-white w-full p-3 rounded-lg hover:bg-indigo-700 transition"
        >
          {loading ? "Analyzing..." : "Analyze Store"}
        </button>

        {analysis && (
          <div className="mt-6 bg-gray-100 p-4 rounded-lg">
            <h2 className="font-semibold mb-2 text-gray-700">AI Insights:</h2>
            <p className="text-gray-800 whitespace-pre-line">{analysis}</p>
          </div>
        )}
      </div>
    </main>
  );
}
