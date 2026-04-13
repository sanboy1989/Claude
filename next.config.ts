import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const withSW = withSerwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Enable Turbopack (default in Next.js 16) - Serwist webpack plugin is disabled in dev
  turbopack: {},
  images: {
    remotePatterns: [],
  },
};

export default withSW(nextConfig);
