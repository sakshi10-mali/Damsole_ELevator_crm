const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['framer-motion'],
  // Disable TypeScript checks during build to reduce memory usage
  typescript: {
    ignoreBuildErrors: true,    // ⛔ disables TS type checking during build
  },
  // Favicon is now in public folder, no rewrite needed
  // Next.js automatically serves /favicon.ico from public folder
  
  // Ensure static files are properly served in production
  async headers() {
    return [
      {
        source: '/main_video.mp4',
        headers: [
          {
            key: 'Content-Type',
            value: 'video/mp4',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Optimize output for production (reduces memory usage)
  // Note: standalone output requires different start command, so disabled for Render compatibility
  // output: 'standalone',
  // Reduce memory usage during build
  experimental: {
    // Optimize memory usage
    optimizeCss: false, // Disable CSS optimization to save memory
  },
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  // Ensure path aliases work correctly during build
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    
    // Optimize webpack memory usage
      config.optimization = {
        ...config.optimization,
      // Reduce memory usage
      moduleIds: 'deterministic',
      // Limit chunk size
        splitChunks: {
          chunks: 'all',
        maxSize: 200000, // 200KB max chunk size
          cacheGroups: {
            default: false,
            vendors: false,
          // Create smaller vendor chunks
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            maxSize: 200000,
          },
          },
        },
      };
    
    // Reduce memory usage in webpack
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    };
    
    return config;
  },
  // Add error handling for chunk loading
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig
