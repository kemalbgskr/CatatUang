import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone',
  // outputFileTracingRoot: __dirname,
} as any;

(nextConfig as any).turbopack = {
  root: '.',
};

export default nextConfig;
