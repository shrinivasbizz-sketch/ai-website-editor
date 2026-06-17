import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // needed for Docker
  env: {
    NEXT_PUBLIC_AGENT_URL: process.env.NEXT_PUBLIC_AGENT_URL ?? "http://localhost:8000",
    NEXT_PUBLIC_EDITOR_URL: process.env.NEXT_PUBLIC_EDITOR_URL ?? "http://localhost:3000",
  },
};

export default nextConfig;
