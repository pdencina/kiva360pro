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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2D1B69',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="antialiased">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      </head>
      <body className="min-h-screen">
        <NavigationProgress />
        {children}
      </body>
    </html>
  )
}
