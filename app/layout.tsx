import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavigationProgress from '@/components/layout/NavigationProgress'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kiva360.cl'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Kiva360 — Software de Gestión Educacional para Colegios y Jardines',
    template: '%s | Kiva360',
  },
  description: 'Plataforma integral de gestión escolar en Chile: matrículas digitales, asistencia, evaluaciones cualitativas, planificación con IA, intervención NEE, cobranzas y comunicación con familias.',
  keywords: [
    'software gestión colegios Chile',
    'plataforma educacional',
    'sistema jardines infantiles',
    'gestión escolar',
    'software NEE',
    'plataforma intervención NEE',
    'matrícula digital colegios',
    'evaluación cualitativa',
    'software centro educativo',
    'Kiva360',
  ],
  authors: [{ name: 'Flexio Technologies SPA' }],
  creator: 'Flexio Technologies SPA',
  publisher: 'Kiva360',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: SITE_URL,
    siteName: 'Kiva360',
    title: 'Kiva360 — Software de Gestión Educacional para Colegios y Jardines',
    description: 'Plataforma integral de gestión escolar en Chile: matrículas digitales, asistencia, evaluaciones cualitativas, planificación con IA, intervención NEE y comunicación con familias.',
    images: [
      {
        url: '/logo-principal/kiva360-horizontal.png',
        width: 1200,
        height: 630,
        alt: 'Kiva360 — Gestión Educacional Integral',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kiva360 — Software de Gestión Educacional',
    description: 'Plataforma integral de gestión escolar en Chile: matrículas, evaluaciones cualitativas, intervención NEE y comunicación con familias.',
    images: ['/logo-principal/kiva360-horizontal.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
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
