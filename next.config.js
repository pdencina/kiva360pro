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
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
}

module.exports = nextConfig
