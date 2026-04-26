/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['pusher'],
  // Reduce memory usage
  experimental: {
    memoryBasedWorkersCount: false,
  },
  // Disable source maps to save memory
  productionBrowserSourceMaps: false,
  // Limit concurrent features
  staticPageGenerationTimeout: 60,
}

export default nextConfig
