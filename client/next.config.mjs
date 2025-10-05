/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: 'http://102.213.183.227:5000/api/auth/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://102.213.183.227:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
