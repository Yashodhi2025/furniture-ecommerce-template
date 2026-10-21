import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

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

export default function config(phase: string): NextConfig {
  return {
    ...nextConfig,
    // Local Lab and the regular preview can run together without sharing output.
    ...(phase === PHASE_DEVELOPMENT_SERVER
      ? { distDir: `.next-dev-${process.env.PORT || '3000'}` }
      : {}),
  };
}
