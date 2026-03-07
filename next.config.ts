import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.1688.com",
      },
      {
        protocol: "https",
        hostname: "cbu01.alicdn.com",
      },
      {
        protocol: "https",
        hostname: "gppserrdbfznhcekafaz.supabase.co",
      },
    ],
  },
};

export default nextConfig;
