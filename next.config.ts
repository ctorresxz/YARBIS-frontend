/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://web-production-67c75.up.railway.app/:path*',
      },
    ];
  },
};

export default nextConfig;
