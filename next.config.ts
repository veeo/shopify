import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@paper-design/shaders-react", "three"],
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Keep the floating Vercel Toolbar / Feedback widget off preview + production.
          { key: "x-vercel-skip-toolbar", value: "1" },
        ],
      },
    ];
  },
};

export default nextConfig;
