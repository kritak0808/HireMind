import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Transpile monorepo workspace packages from TypeScript source
  transpilePackages: [
    "@hiremind/ui",
    "@hiremind/sdk",
    "@hiremind/constants",
    "@hiremind/types",
    "@hiremind/utilities"
  ],

  // Production API proxy rewrites
  // When NEXT_PUBLIC_API_URL is set (Railway URL), all /api/** requests
  // are proxied through Next.js to avoid CORS preflight issues on Vercel.
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl || apiUrl.includes('localhost')) {
      return [];
    }
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },

  // Security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
