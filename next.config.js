/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  async rewrites() {
    return [
      {
        source: '/docs/:path*',
        destination: '/api/docs/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
