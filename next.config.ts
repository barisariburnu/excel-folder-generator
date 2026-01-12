import type { NextConfig } from "next";

const allowedOrigins = [
  "localhost:3000",
  ...(process.env.ALLOWED_ORIGINS?.split(",") || []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: allowedOrigins,
  experimental: {
    serverActions: {
      allowedOrigins: allowedOrigins,
    },
  },
};

export default nextConfig;
