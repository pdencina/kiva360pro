export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const metadata = { title: 'Horario de clases' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

export default async function PortalHorariosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any

  // Obtener alumno(s) vinculados
  let curso = ''
  let alumnoNombre = ''
  if (usuario.rol === 'apoderado') {
    const { data: vinculos } = await admin.from('tutor_alumnos').select('alumno:alumnos(nombre, apellido, curso)').eq('tutor_id', user.id)
    const alumno = (vinculos as any)?.[0]?.alumno
    curso = alumno?.curso ?? ''
    alumnoNombre = alumno ? `${alumno.nombre} ${alumno.apellido}` : ''
  } else if (usuario.rol === 'alumno') {
    const { data: va } = await admin.from('usuario_alumno').select('alumno:alumnos(nombre, apellido, curso)').eq('usuario_id', user.id).single()
    curso = (va as any)?.alumno?.curso ?? ''
    alumnoNombre = (va as any)?.alumno ? `${(va as any).alumno.nombre} ${(va as any).alumno.apellido}` : ''
  }

  if (!curso) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-900 font-display mb-2">Horario de clases</h1>
        <p className="text-slate-500">No hay un horario asignado aún. Contacte al establecimiento.</p>
      </div>
    )
  }

  // Obtener horarios del curso
  const { data: horarios } = await admin
    .from('horarios')
    .select('*')
    .eq('colegio_id', usuario.colegio_id)
    .eq('curso', curso)
    .order('dia')
    .order('hora_inicio')

  const bloques = (horarios ?? []) as any[]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 font-display">Horario de clases</h1>
        <p className="text-sm text-slate-500 mt-0.5">{alumnoNombre} · {curso}</p>
      </div>

      {bloques.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <i className="ti ti-clock text-4xl text-slate-300 block mb-2" aria-hidden="true"/>
          <p className="text-slate-500">El horario de este curso aún no ha sido configurado.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left w-20">Hora</th>
                  {DIAS.map(d => (
                    <th key={d} className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getHorasUnicas(bloques).map(hora => (
                  <tr key={hora} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-xs text-slate-500 font-mono whitespace-nowrap">{hora}</td>
                    {[1, 2, 3, 4, 5].map(dia => {
                      const bloque = bloques.find((b: any) => b.dia === dia && b.hora_inicio === hora)
                      return (
                        <td key={dia} className="px-2 py-2 text-center">
                          {bloque ? (
                            <div
                              className="rounded-lg px-2 py-2 text-xs"
                              style={{ backgroundColor: bloque.color ? `${bloque.color}15` : '#f0f4f8', borderLeft: `3px solid ${bloque.color || '#3b82f6'}` }}
                            >
                              <div className="font-semibold text-slate-800">{bloque.materia}</div>
                              {bloque.profesor && <div className="text-slate-500 text-[10px] mt-0.5">{bloque.profesor}</div>}
                              {bloque.sala && <div className="text-slate-400 text-[10px]">Sala {bloque.sala}</div>}
                            </div>
                          ) : (
                            <span className="text-slate-200">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function getHorasUnicas(bloques: any[]): string[] {
  const horas = [...new Set(bloques.map((b: any) => b.hora_inicio))].sort()
  return horas
}
