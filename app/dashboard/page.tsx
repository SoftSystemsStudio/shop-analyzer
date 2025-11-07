"use client";
import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Trash2, Download, Calendar, TrendingUp } from "lucide-react";

interface Analysis {
  id: string;
  storeUrl: string;
  storeName: string;
  platform: string;
  insights: string;
  productCount: number;
  avgPrice: string;
  timestamp: number;
  products: any[];
}

export default function Dashboard() {
  const { isSignedIn, user, isLoaded } = useUser();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isSignedIn, isLoaded, router]);

  // Load analyses from localStorage
  useEffect(() => {
    if (isSignedIn && user) {
      loadAnalyses();
    }
  }, [isSignedIn, user]);

  const loadAnalyses = () => {
    const stored = localStorage.getItem(`analyses_${user?.id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setAnalyses(parsed.sort((a: Analysis, b: Analysis) => b.timestamp - a.timestamp));
    }
  };

  const deleteAnalysis = (id: string) => {
    const updated = analyses.filter((a) => a.id !== id);
    setAnalyses(updated);
    localStorage.setItem(`analyses_${user?.id}`, JSON.stringify(updated));
    if (selectedAnalysis?.id === id) {
      setSelectedAnalysis(null);
    }
  };

  const exportToPDF = (analysis: Analysis) => {
    const text = `
SHOP ANALYSIS REPORT
====================

Store: ${analysis.storeName}
URL: ${analysis.storeUrl}
Platform: ${analysis.platform}
Date: ${new Date(analysis.timestamp).toLocaleDateString()}

${analysis.insights}

---
Products Found: ${analysis.productCount}
Average Price: ${analysis.avgPrice}
    `.trim();

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analysis.storeName}_analysis_${Date.now()}.txt`;
    a.click();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <span className="text-3xl">🛍️</span>
              <h1 className="text-2xl font-bold text-gray-800">Shop Analyzer</h1>
            </a>
            <nav className="flex gap-4">
              <a href="/" className="text-gray-600 hover:text-gray-800 font-medium">
                Analyze
              </a>
              <a
                href="/dashboard"
                className="text-indigo-600 font-medium border-b-2 border-indigo-600"
              >
                Dashboard
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.firstName || user.emailAddresses[0].emailAddress}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Analysis History</h2>
          <p className="text-gray-600">
            {analyses.length === 0
              ? "No analyses yet. Start by analyzing your first store!"
              : `You've analyzed ${analyses.length} store${
                  analyses.length !== 1 ? "s" : ""
                }`}
          </p>
        </div>

        {analyses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Analyses Yet</h3>
            <p className="text-gray-600 mb-6">
              Start analyzing stores to see your history here
            </p>
            <a
              href="/"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Analyze Your First Store
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Analysis List */}
            <div className="lg:col-span-1 space-y-3">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  onClick={() => setSelectedAnalysis(analysis)}
                  className={`bg-white rounded-lg p-4 cursor-pointer transition border-2 ${
                    selectedAnalysis?.id === analysis.id
                      ? "border-indigo-600 shadow-md"
                      : "border-transparent hover:border-indigo-200 shadow"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {analysis.storeName}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(analysis.timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAnalysis(analysis.id);
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {analysis.productCount} products
                    </span>
                    {analysis.avgPrice !== "N/A" && (
                      <span className="font-medium text-indigo-600">
                        ${analysis.avgPrice}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Analysis Detail */}
            <div className="lg:col-span-2">
              {selectedAnalysis ? (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-1">
                        {selectedAnalysis.storeName}
                      </h2>
                      <a
                        href={selectedAnalysis.storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:underline"
                      >
                        {selectedAnalysis.storeUrl}
                      </a>
                      <p className="text-sm text-gray-500 mt-2">
                        Analyzed {new Date(selectedAnalysis.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => exportToPDF(selectedAnalysis)}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-indigo-100">
                    <div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                      {selectedAnalysis.insights}
                    </div>
                  </div>

                  {selectedAnalysis.products &&
                    selectedAnalysis.products.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-semibold text-gray-800 mb-3">
                          Sample Products ({selectedAnalysis.products.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                          {selectedAnalysis.products.map((product, idx) => (
                            <div
                              key={idx}
                              className="bg-gray-50 p-3 rounded border border-gray-200"
                            >
                              <div className="font-medium text-gray-800 text-sm line-clamp-2">
                                {product.title}
                              </div>
                              {product.price && (
                                <div className="text-indigo-600 font-semibold text-sm mt-1">
                                  {product.price}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <div className="text-6xl mb-4">👈</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Select an Analysis
                  </h3>
                  <p className="text-gray-600">
                    Click on any analysis from the list to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
