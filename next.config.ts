import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the application root explicitly. Turbopack's automatic root detection
  // can otherwise latch onto unrelated lockfiles in ancestor directories.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
