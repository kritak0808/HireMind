import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    "@hiremind/ui",
    "@hiremind/sdk",
    "@hiremind/constants",
    "@hiremind/types",
    "@hiremind/utilities"
  ]
};

export default nextConfig;
