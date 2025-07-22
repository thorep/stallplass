import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
