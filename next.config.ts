import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "ideal-space-trout-r7r56g77q9x26xw-3000.app.github.dev", // 👈 your Codespaces URL
      ],
    },
  },
};

export default nextConfig;
