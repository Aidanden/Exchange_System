import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://102.213.183.227:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
