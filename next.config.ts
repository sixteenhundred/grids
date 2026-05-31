import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Shop logos/banners/covers are sent as data URLs through Server Actions.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
