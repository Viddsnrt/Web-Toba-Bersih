import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@prisma/client"],
  
  // Tambahkan ini untuk mengizinkan akses dari IP lokal
  allowedDevOrigins: ['192.168.56.1', 'localhost'],
  
  // Untuk Next.js 16.1.6, gunakan format ini
  experimental: {
    // Konfigurasi lain jika ada
  },
};

export default nextConfig;