import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kiva360 — Gestión Educacional que transforma colegios',
  description: 'Plataforma integral para administrar matrículas, asistencias, calificaciones, cobranzas y comunicación con familias. Todo en un solo lugar.',
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  )
}
