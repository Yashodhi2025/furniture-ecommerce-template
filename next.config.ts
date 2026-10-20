import type { NextConfig } from 'next';

const basePath = (process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? '').replace(
  /\/$/,
  '',
);

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  outputFileTracingRoot: process.cwd(),
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
