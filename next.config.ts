import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts", "@radix-ui/react-select", "@radix-ui/react-dialog"],
  },
  reactStrictMode: true,
};

export default nextConfig;
