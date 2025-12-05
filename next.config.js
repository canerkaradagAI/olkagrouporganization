const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Production'da image optimization açık (Vercel otomatik optimize eder)
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Build performansı için
  swcMinify: true,
  // Production'da console.log'ları kaldır
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Prisma cache sorunu için
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client')
    }
    return config
  },
};

module.exports = nextConfig;
