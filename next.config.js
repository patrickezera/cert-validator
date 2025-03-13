/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure Next.js knows about your custom output directory
  distDir: "dist",
  // Configure rewrites to handle API routes
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
