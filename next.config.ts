import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  images: {
    // Cache images for 31 days to reduce transformations
    // Images rarely change (they are replaced), so a long TTL helps minimize MISSes
    minimumCacheTTL: 2678400, // 31 days in seconds

    // Reduce formats to a single target to avoid duplicate transforms per width
    formats: ['image/webp'],

    // Provide mid-range widths so list thumbnails get right-sized variants
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 320, 384, 512],

    // Tailwind-aligned breakpoints for responsive images
    deviceSizes: [640, 768, 1024, 1280],
    
    remotePatterns: [
      // Local Supabase Storage (dev)
      { protocol: 'http', hostname: '127.0.0.1', port: '54321', pathname: '/storage/v1/object/public/stableimages/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '54321', pathname: '/storage/v1/object/public/boximages/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '54321', pathname: '/storage/v1/object/public/service-photos/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '54321', pathname: '/storage/v1/object/public/part-loan-horse/**' },

      // Production Supabase Storage
      { protocol: 'https', hostname: 'wawnmmmwkysbtexbmdwg.supabase.co', port: '', pathname: '/storage/v1/object/public/stableimages/**' },
      { protocol: 'https', hostname: 'wawnmmmwkysbtexbmdwg.supabase.co', port: '', pathname: '/storage/v1/object/public/boximages/**' },
      { protocol: 'https', hostname: 'wawnmmmwkysbtexbmdwg.supabase.co', port: '', pathname: '/storage/v1/object/public/service-photos/**' },
      { protocol: 'https', hostname: 'wawnmmmwkysbtexbmdwg.supabase.co', port: '', pathname: '/storage/v1/object/public/part-loan-horse/**' },

      // Picsum placeholder images (dev/demo only)
      { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
      {
        source: '/ingest/flags',
        destination: 'https://eu.i.posthog.com/flags',
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
