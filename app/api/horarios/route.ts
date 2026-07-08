import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const { searchParams } = new URL(request.url)
  const curso = searchParams.get('curso')

  let query = supabase.from('horarios').select('*').order('dia').order('hora_inicio')
  if (curso) query = query.eq('curso', curso)

  const { data, error } = await query
  if (error) return NextResponse.json([], { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { curso, dia, hora_inicio, hora_fin, materia, profesor, sala, color, colegio_id } = body

  if (!curso || !dia || !hora_inicio || !hora_fin || !materia) {
    return NextResponse.json({ error: 'Campos requeridos: curso, dia, hora_inicio, hora_fin, materia' }, { status: 400 })
  }

  const { data: ur } = await supabase.from('usuarios').select('colegio_id').eq('id', user.id).single()
  const colegioId = colegio_id || (ur as any)?.colegio_id

  const { data, error } = await supabase.from('horarios').insert({
    colegio_id: colegioId,
    curso, dia, hora_inicio, hora_fin, materia,
    profesor: profesor || null,
    sala: sala || null,
    color: color || '#3b82f6',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { error } = await supabase.from('horarios').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
