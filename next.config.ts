import type { NextConfig } from "next";

const API_PROXY_TARGET = (process.env.API_PROXY_TARGET || "http://localhost:5000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  
  allowedDevOrigins: [
    '10.195.21.83',
    'localhost',
    '127.0.0.1',
    '*.ngrok-free.dev',
    '*.ngrok.app',
  ],
  
  experimental: {},

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_PROXY_TARGET}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${API_PROXY_TARGET}/uploads/:path*`,
      },
    ];
  },
  
  reactStrictMode: true,
};

export default nextConfig;
