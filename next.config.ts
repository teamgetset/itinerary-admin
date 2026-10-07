import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Image uploads go through server actions (the API allows 10 MB images).
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
