import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API calls are now handled directly via NEXT_PUBLIC_API_URL environment variable
  // No need for rewrites as all API files use the env variable
};

export default nextConfig;
