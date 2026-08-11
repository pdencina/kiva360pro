import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET: Verificar estado de propuesta (público, sin auth)
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug requerido' }, { status: 400 })

  const admin = getAdmin()
  const { data } = await admin
    .from('propuestas')
    .select('estado, aceptada_por, aceptada_at, firma_nombre, firma_ip, email_cliente, plan, monto_mensual, modalidad_pago')
    .eq('slug', slug)
    .single()

  if (!data) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  })
}
