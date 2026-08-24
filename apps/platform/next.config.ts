import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
