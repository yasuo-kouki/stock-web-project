import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静的エクスポートの設定（Azure Static Web Apps用）
  output: 'export',
  // 画像の最適化を無効化（静的エクスポート時）
  images: {
    unoptimized: true
  },
  // トレーリングスラッシュを無効化
  trailingSlash: false,
  // 環境変数の設定（ビルド時・開発時に使用）
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
  },
};

export default nextConfig;
