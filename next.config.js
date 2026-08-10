/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TODO: Quitar esto una vez arreglados los errores TS heredados
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  async rewrites() {
    return [
      { source: '/demo/sakurakids', destination: '/demo-sakurakids.html' },
    ]
  },
}

module.exports = nextConfig
