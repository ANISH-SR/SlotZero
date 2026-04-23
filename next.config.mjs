/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Prevents Turbopack from bundling the Node.js-only Pusher server SDK.
  // It will be required at runtime instead, avoiding the CJS 'not a constructor' error.
  serverExternalPackages: ['pusher'],
}

export default nextConfig
