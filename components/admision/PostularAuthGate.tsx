'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  colegio: {
    id: string; nombre: string; direccion: string | null
    telefono: string | null; logo_url: string | null
  }
}

export default function PostularAuthGate({ colegio }: Props) {
  const [mode, setMode] = useState<'register' | 'login'>('register')
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Crear cuenta vía API
      const res = await fetch('/api/postular/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          nombre: form.nombre,
          apellido: form.apellido,
          colegio_id: colegio.id,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Login automático después del registro
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (loginErr) throw new Error('Cuenta creada pero error al iniciar sesión. Intenta iniciar sesión manualmente.')

      // Recargar la página para que el server detecte la sesión
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (loginErr) throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.')

      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F7F5]">
      {/* Header */}
      <div className="border-b border-[#e2dfd9] bg-[#0d1b2a]">
        <div className="max-w-md mx-auto px-6 py-6 flex items-center gap-4">
          {colegio.logo_url ? (
            <img src={colegio.logo_url} alt={colegio.nombre} className="w-12 h-12 rounded-xl object-cover bg-white" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <img src="/icono-solo/kiva360-icon.svg" alt="Kiva360" className="w-8 h-8" />
            </div>
          )}
          <div>
            <h1 className="text-[18px] font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {colegio.nombre}
            </h1>
            <p className="text-[12px] text-white/60">Portal de postulación</p>
          </div>
        </div>
      </div>

      {/* Auth form */}
      <div className="max-w-md mx-auto px-6 py-10">
        <div className="mb-8 text-center">
          <h2 className="text-[22px] font-bold text-[#1A1035]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {mode === 'register' ? 'Crea tu cuenta para postular' : 'Inicia sesión'}
          </h2>
          <p className="text-[14px] text-[#5C5470] mt-2 leading-relaxed">
            {mode === 'register'
              ? 'Regístrate para enviar tu postulación y hacer seguimiento del proceso.'
              : 'Ingresa con tu cuenta para continuar con tu postulación.'
            }
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#f0ede9] rounded-xl p-1 mb-6">
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all ${mode === 'register' ? 'bg-white text-[#1A1035] shadow-sm' : 'text-[#5C5470]'}`}
          >
            Crear cuenta
          </button>
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all ${mode === 'login' ? 'bg-white text-[#1A1035] shadow-sm' : 'text-[#5C5470]'}`}
          >
            Iniciar sesión
          </button>
        </div>

        <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-4">
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Nombre *</label>
                <input
                  type="text" value={form.nombre} required
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:ring-[#0d1b2a]/10 focus:border-transparent transition-all outline-none"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Apellido</label>
                <input
                  type="text" value={form.apellido}
                  onChange={e => setForm({ ...form, apellido: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:ring-[#0d1b2a]/10 focus:border-transparent transition-all outline-none"
                  placeholder="Tu apellido"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Correo electrónico *</label>
            <input
              type="email" value={form.email} required
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:ring-[#0d1b2a]/10 focus:border-transparent transition-all outline-none"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Contraseña *</label>
            <input
              type="password" value={form.password} required minLength={6}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:ring-[#0d1b2a]/10 focus:border-transparent transition-all outline-none"
              placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[12px] text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-[14px] font-semibold text-white bg-[#0d1b2a] transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
          >
            {loading
              ? (mode === 'register' ? 'Creando cuenta...' : 'Ingresando...')
              : (mode === 'register' ? 'Crear cuenta y postular' : 'Ingresar')
            }
          </button>
        </form>

        <p className="text-center text-[11px] text-[#9a9a9a] mt-6">
          {mode === 'register'
            ? 'Al crear tu cuenta podrás hacer seguimiento del estado de tu postulación.'
            : '¿No tienes cuenta? Selecciona "Crear cuenta" arriba.'
          }
        </p>
      </div>

      {/* Footer */}
      <div className="border-t border-[#e2dfd9] py-6">
        <p className="text-center text-[11px] text-[#9a9a9a]">
          Potenciado por <a href="https://kiva360.cl" className="font-medium text-[#0d1b2a] hover:underline">Kiva360</a>
        </p>
      </div>
    </div>
  )
}
