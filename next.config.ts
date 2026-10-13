import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Let phones on the local network load the dev server (scripts + hot reload).
  allowedDevOrigins: ["192.168.1.34"],
};

export default nextConfig;
