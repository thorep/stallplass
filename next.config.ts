import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'keyassets.timeincuk.net',
        port: '',
        pathname: '/inspirewp/live/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'www.titangarages.com.au',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      // Firebase Storage
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/stallplass.firebasestorage.app/o/**',
      },
      // Alternative Firebase Storage hostname
      {
        protocol: 'https',
        hostname: 'stallplass.firebasestorage.app',
        port: '',
        pathname: '/**',
      },
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
