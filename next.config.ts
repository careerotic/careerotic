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
  },
  // Keep request-time Supabase/session routes on the default renderer. Cache Components
  // caused production Date.now() prerender errors inside Supabase auth session loading.

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
