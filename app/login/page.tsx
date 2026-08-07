'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Credenciales incorrectas.')
      setLoading(false)
      return
    }
    const { data: usuario } = await supabase.from('usuarios').select('rol, colegio_id').eq('id', data.user.id).single()
    const rol = (usuario as any)?.rol
    const colegioId = (usuario as any)?.colegio_id

    if (rol === 'super_admin' && !colegioId) {
      router.push('/super-admin')
    } else if (['apoderado', 'alumno'].includes(rol)) {
      router.push('/portal')
    } else if (rol === 'postulante') {
      router.push('/portal/postulacion')
    } else {
      router.push('/inicio')
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--k-gradient-hero)' }}>
      {/* Panel izquierdo */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#5B3E9E]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#E85D3A]/5 rounded-full blur-[100px]" />
        
        <div className="relative">
          <Link href="/" className="flex items-center gap-3 mb-16">
            <img src="/icono-solo/kiva360-icon.svg" alt="Kiva360" className="w-10 h-10 rounded-[10px]" />
            <span className="font-display font-bold text-xl text-white tracking-tight">Kiva360</span>
          </Link>
          <h1 className="font-display text-4xl font-bold text-white leading-tight mb-5">
            Gestión escolar<br/>
            <span className="text-gradient-brand">sin fricción</span>
          </h1>
          <p className="text-white/40 text-[15px] leading-relaxed max-w-md">
            Administra matrículas, asistencia, calificaciones y cobranzas de manera centralizada y profesional.
          </p>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[0,1,2].map(i => (
                <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-[#5B3E9E] to-[#E85D3A] border-2 border-[#1A1035] flex items-center justify-center text-[9px] text-white font-bold">
                  {['M','C','J'][i]}
                </div>
              ))}
            </div>
            <span className="text-[12px] text-white/30">+15 colegios activos</span>
          </div>
        </div>
      </div>

      {/* Panel derecho - formulario */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <img src="/icono-solo/kiva360-icon.svg" alt="Kiva360" className="w-9 h-9 rounded-[10px]" />
            <span className="font-display font-bold text-lg text-[#1A1035] tracking-tight">Kiva360</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-[#1A1035] mb-1">Iniciar sesión</h2>
          <p className="text-[#5C5470] text-sm mb-8">Ingresa con tu cuenta institucional</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#5C5470] uppercase tracking-wider mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-base h-11"
                placeholder="usuario@institucion.org"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5C5470] uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-base h-11"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-white font-semibold rounded-lg transition-all disabled:opacity-60 text-sm tracking-wide hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: 'var(--k-gradient-cta)' }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/forgot-password" className="text-xs text-[#5C5470] hover:text-[#5B3E9E] transition-colors">¿Olvidaste tu contraseña?</a>
          </div>

          <div className="mt-16 pt-6 border-t border-[#e2dfd9] text-center">
            <p className="text-[10px] text-[#5C5470]/50 uppercase tracking-widest">Kiva360 · Gestión Educacional</p>
          </div>
        </div>
      </div>
    </div>
  )
}
