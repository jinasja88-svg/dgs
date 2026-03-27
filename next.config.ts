import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['undici'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.1688.com",
      },
      {
        protocol: "https",
        hostname: "**.alicdn.com",
      },
      {
        protocol: "https",
        hostname: "gppserrdbfznhcekafaz.supabase.co",
      },
    ],
  },
};

export default nextConfig;
