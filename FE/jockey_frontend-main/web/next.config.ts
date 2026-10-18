import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  transpilePackages: [],
  turbopack: { root: path.resolve(process.cwd(), '..') },
  env: {
    NEXT_PUBLIC_USE_MOCK_API: process.env.NEXT_PUBLIC_USE_MOCK_API ?? 'false',
    NEXT_PUBLIC_API_PROXY: 'true',
  },
};

export default nextConfig;
