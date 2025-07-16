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
    ],
  },
};

export default nextConfig;
