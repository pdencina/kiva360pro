export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Trusted from '@/components/landing/Trusted'
import Features from '@/components/landing/Features'
import AdmisionPipeline from '@/components/landing/AdmisionPipeline'
import ReporteDiarioShowcase from '@/components/landing/ReporteDiarioShowcase'
import Stats from '@/components/landing/Stats'
import Modules from '@/components/landing/Modules'
import ComoFunciona from '@/components/landing/ComoFunciona'
import Pricing from '@/components/landing/Pricing'
import FAQ from '@/components/landing/FAQ'
import CTA from '@/components/landing/CTA'
import Footer from '@/components/landing/Footer'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Authenticated users go to their dashboard
  if (user) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
    const usuario = ur as any

    if (usuario?.rol === 'super_admin' && !usuario?.colegio_id) {
      redirect('/super-admin')
    }
    if (['apoderado', 'alumno'].includes(usuario?.rol)) {
      redirect('/portal')
    }
    redirect('/inicio')
  }

  // Unauthenticated users see the landing page
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kiva360.cl'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'Kiva360',
        legalName: 'Flexio Technologies SPA',
        url: siteUrl,
        logo: `${siteUrl}/logo-principal/kiva360-horizontal.png`,
        email: 'pablo@kiva360.cl',
        telephone: '+56949616038',
        areaServed: 'CL',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+56949616038',
          email: 'pablo@kiva360.cl',
          contactType: 'sales',
          availableLanguage: ['es'],
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${siteUrl}/#software`,
        name: 'Kiva360',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: siteUrl,
        description:
          'Plataforma integral de gestión escolar en Chile: matrículas digitales, asistencia, evaluaciones cualitativas, planificación con IA, intervención NEE, cobranzas y comunicación con familias.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'CLP',
          description: 'Solicita una demostración gratuita',
        },
        publisher: { '@id': `${siteUrl}/#organization` },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'Kiva360',
        inLanguage: 'es-CL',
        publisher: { '@id': `${siteUrl}/#organization` },
      },
      {
        '@type': 'FAQPage',
        '@id': `${siteUrl}/#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: '¿Cuánto demora implementar Kiva360 en mi centro?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'La mayoría de los centros quedan operativos en menos de una semana. Cargamos tus cursos, alumnos y programas, y capacitamos a tu equipo y a las familias.',
            },
          },
          {
            '@type': 'Question',
            name: '¿Puedo migrar los datos que ya tengo?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Sí. Si tienes tus alumnos y apoderados en Excel o en otro sistema, los importamos durante la configuración inicial sin que pierdas información.',
            },
          },
          {
            '@type': 'Question',
            name: '¿Funciona en el celular?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Completamente. El equipo del centro y los apoderados pueden usar Kiva360 desde el teléfono: reportes diarios, comunicados, asistencia, pagos y firma de documentos.',
            },
          },
          {
            '@type': 'Question',
            name: '¿Es seguro el manejo de datos de menores?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'La información se aloja en infraestructura cifrada y cada perfil ve solo lo que le corresponde. Las firmas quedan registradas con fecha, hora e IP para respaldo legal.',
            },
          },
          {
            '@type': 'Question',
            name: '¿Sirve para centros NEE y jardines, no solo colegios?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Sí. Kiva360 es transversal: se usa en jardines infantiles, escuelas de lenguaje, centros de intervención NEE y colegios, con evaluación cualitativa, planes de intervención, agenda de sesiones y reporte diario.',
            },
          },
          {
            '@type': 'Question',
            name: '¿Tengo que firmar un contrato de permanencia?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. Trabajamos con planes mensuales sin permanencia, con actualizaciones y soporte incluidos.',
            },
          },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <Hero />
      <Trusted />
      <Features />
      <AdmisionPipeline />
      <ReporteDiarioShowcase />
      <Stats />
      <Modules />
      <ComoFunciona />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  )
}
