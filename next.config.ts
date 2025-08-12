import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  images: {
    // Cache images for 31 days to reduce transformations
    minimumCacheTTL: 2678400, // 31 days in seconds
    
    // Allow multiple formats to prevent conversion failures
    formats: ['image/webp', 'image/avif'],
    
    // Allow common quality levels
    qualities: [50, 60, 75, 85, 100],
    
    // Optimize sizes for actual usage patterns (including thumbnail sizes)
    imageSizes: [
      16, 32, 48, 64, 96, 128, 200, 256, 384
    ],
    
    // Focus on mobile-first device sizes
    deviceSizes: [
      640, 750, 828, 1080, 1200, 1920
    ],
    
    remotePatterns: [
      // Local Supabase Storage
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      // Production Supabase Storage
      {
        protocol: 'https',
        hostname: 'wawnmmmwkysbtexbmdwg.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Picsum placeholder images
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
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
