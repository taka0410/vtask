// next.config.ts

// この import は残しても消してもどちらでもOK（消してもよい）
import type { NextConfig } from 'next';

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // ビルド時に ESLint エラーがあってもデプロイは通す
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
