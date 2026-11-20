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
    // Keep dev caches under .cache so Local Lab and dev servers stay isolated
    // and are automatically excluded from Deneb's source-only template archive.
    ...(phase === PHASE_DEVELOPMENT_SERVER
      ? { distDir: `.cache/next-dev-${process.env.PORT || '3000'}` }
      : {}),
  };
}
