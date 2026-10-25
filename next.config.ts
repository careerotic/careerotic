import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: "/learn",
        destination: "/questions",
        permanent: true,
      },
      {
        source: "/learn/:path*",
        destination: "/questions",
        permanent: true,
      },
    ];
  },
  experimental: {
    agentFeedback: true,
    // Keep visited page segments in the client router cache for instant return navigation.
    // AppShell refreshes previously visited routes in the background after 30 seconds.
    staleTimes: {
      dynamic: 600,
      static: 180,
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
