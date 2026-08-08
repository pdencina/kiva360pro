import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavigationProgress from '@/components/layout/NavigationProgress'

export const metadata: Metadata = {
  title: {
    default: 'Kiva360 — Gestión Educacional Integral',
    template: '%s | Kiva360',
  },
  description: 'Plataforma integral de gestión escolar: matrículas, asistencias, calificaciones, cobranzas y comunicación con familias.',
  keywords: ['gestión escolar', 'Kiva360', 'plataforma educacional', 'colegio', 'software escolar Chile'],
  icons: {
    icon: [
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/favicon/apple-touch-icon.png',
    shortcut: '/favicon/favicon.ico',
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0d1b2a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="antialiased">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen overscroll-none">
        <NavigationProgress />
        {children}
      </body>
    </html>
  )
}
