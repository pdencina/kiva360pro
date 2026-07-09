import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST: Crear comunicado
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any

  if (!['super_admin', 'admin', 'tutor'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { titulo, contenido, tipo, cursos } = await request.json()

  if (!titulo || !contenido) {
    return NextResponse.json({ error: 'Título y contenido son requeridos' }, { status: 400 })
  }

  const { data, error } = await admin.from('comunicados').insert({
    colegio_id: usuario.colegio_id,
    titulo,
    contenido,
    tipo: tipo ?? 'general',
    curso: Array.isArray(cursos) && cursos.length > 0 ? cursos[0] : null,
    creado_por: user.id,
    enviado_at: new Date().toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// GET: Listar comunicados del colegio
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any

  const { data } = await admin
    .from('comunicados')
    .select('*, comunicado_recepciones(estado, familia_id)')
    .eq('colegio_id', usuario.colegio_id)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
