import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET: Obtener datos públicos del colegio para el formulario de postulación
export async function GET(request: NextRequest) {
  const colegioId = request.nextUrl.searchParams.get('id')

  if (!colegioId) {
    return NextResponse.json({ error: 'ID de colegio requerido' }, { status: 400 })
  }

  const admin = getAdmin()
  const { data: colegio, error } = await admin
    .from('colegios')
    .select('id, nombre, direccion, telefono, logo_url, color_primario, color_acento')
    .eq('id', colegioId)
    .single()

  if (error || !colegio) {
    console.error('GET /api/postular/colegio error:', error)
    return NextResponse.json({ error: 'Colegio no encontrado' }, { status: 404 })
  }

  return NextResponse.json(colegio)
}
