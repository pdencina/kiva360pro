export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import Stats from '@/components/landing/Stats'
import Modules from '@/components/landing/Modules'
import Pricing from '@/components/landing/Pricing'
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
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <Stats />
      <Modules />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  )
}
