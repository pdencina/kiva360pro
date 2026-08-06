import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST: Aceptar propuesta (público — el cliente acepta)
export async function POST(request: NextRequest) {
  const admin = getAdmin()
  const body = await request.json()
  const { slug, nombre_aceptante, modalidad } = body

  if (!slug || !nombre_aceptante) {
    return NextResponse.json({ error: 'slug y nombre_aceptante requeridos' }, { status: 400 })
  }

  const { data: propuesta } = await admin.from('propuestas').select('*').eq('slug', slug).single()
  if (!propuesta) return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 })
  if ((propuesta as any).estado !== 'enviada') {
    return NextResponse.json({ error: 'Esta propuesta ya fue procesada' }, { status: 400 })
  }

  const updates: any = {
    estado: 'aceptada',
    aceptada_at: new Date().toISOString(),
    aceptada_por: nombre_aceptante,
  }
  if (modalidad) updates.modalidad_pago = modalidad

  const { data, error } = await admin.from('propuestas').update(updates).eq('slug', slug).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
