import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavigationProgress from '@/components/layout/NavigationProgress'
import { BRANDING } from '@/lib/branding'

export const metadata: Metadata = {
  title: {
    default: BRANDING.metaTitle,
    template: BRANDING.metaTitleTemplate,
  },
  description: BRANDING.metaDescription,
  keywords: BRANDING.metaKeywords,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a2332',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="antialiased">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Kiva360" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      </head>
      <body className="min-h-screen">
        <NavigationProgress />
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
          }
        `}} />
      </body>
    </html>
  )
}
