import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // ビルド時に ESLint エラーがあってもデプロイは通す
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
