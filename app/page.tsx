"use client";
import { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn, user } = useUser();
  const [storeUrl, setStoreUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState("");

  const analyzeStore = async () => {
    if (!storeUrl) {
      setError("Please enter a store URL.");
      return;
    }

    setLoading(true);
    setAnalysis("");
    setProducts([]);
    setError("");

    try {
      const res = await fetch(`/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to analyze store");
        return;
      }

      setAnalysis(data.result || "No analysis available.");
      setProducts(data.products || []);

      if (isSignedIn && user && data.shouldSave && data.analysisData) {
        const storageKey = `analyses_${user.id}`;
        const existing = localStorage.getItem(storageKey);
        const analyses = existing ? JSON.parse(existing) : [];

        analyses.unshift({
          id: Date.now().toString(),
          ...data.analysisData,
          timestamp: Date.now(),
        });

        if (analyses.length > 50) {
          analyses.splice(50);
        }

        localStorage.setItem(storageKey, JSON.stringify(analyses));
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Error analyzing store. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* ✅ Updated header section */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛍️</span>
              <h1 className="text-2xl font-bold text-gray-800">Shop Analyzer</h1>
            </div>
            {isSignedIn && (
              <nav className="flex gap-4">
                <a
                  href="/"
                  className="text-indigo-600 font-medium border-b-2 border-indigo-600"
                >
                  Analyze
                </a>
                <a
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  Dashboard
                </a>
              </nav>
            )}
          </div>

          {/* ✅ Right-side Clerk / Auth section */}
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <>
                <span className="text-sm text-gray-600">
                  Hey, {user?.firstName || user?.emailAddresses[0].emailAddress}!
                </span>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <a
                  href="/sign-in"
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Sign In
                </a>
                <a
                  href="/sign-up"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Sign Up Free
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-2 text-gray-800">
            Analyze Any Shop in Seconds
          </h2>
          <p className="text-gray-600">
            Get instant insights on pricing, products, and growth opportunities
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl">
          <input
            type="text"
            value={storeUrl}
            onChange={(e) => setStoreUrl(e.target.value)}
            placeholder='Try "demo" to see it in action!'
            className="border w-full p-4 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            onKeyDown={(e) => e.key === "Enter" && analyzeStore()}
          />
          <button
            type="button"
            onClick={analyzeStore}
            disabled={loading}
            className="bg-indigo-600 text-white w-full p-4 rounded-lg hover:bg-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "🔍 Analyze Store"}
          </button>

          {!isSignedIn && (
            <div className="mt-4 bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-blue-800 text-sm">
                💡 <strong>Sign up free</strong> to save your analyses and track
                store performance over time!
              </p>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-red-700">❌ {error}</p>
              {error.includes("suggestion") && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
            </div>
          )}

          {analysis && (
            <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-indigo-100">
              <h2 className="font-bold text-xl mb-4 text-gray-800">
                📊 Analysis Results
              </h2>
              <div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                {analysis}
              </div>
            </div>
          )}

          {products.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                🛒 Sample Products Found:
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {products.map((product, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 p-3 rounded border border-gray-200"
                  >
                    <div className="font-medium text-gray-800 text-sm">
                      {product.title}
                    </div>
                    {product.price && (
                      <div className="text-indigo-600 font-semibold text-sm">
                        {product.price}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600 text-sm">
          <p>
            © 2024 Shop Analyzer. Analyze Shopify & Etsy stores with AI-powered
            insights.
          </p>
        </div>
      </footer>
    </main>
  );
}
