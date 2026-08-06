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

// GET: Exportar todos los datos del colegio (solo admin/super_admin)
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Solo el director puede exportar datos' }, { status: 403 })
  }

  const colegioId = usuario.colegio_id
  const { searchParams } = new URL(request.url)
  const formato = searchParams.get('formato') || 'json' // json | csv

  // Export all tables for this colegio
  const [
    { data: colegio },
    { data: alumnos },
    { data: familias },
    { data: usuarios },
    { data: cobros },
    { data: pagos },
    { data: asistencias },
    { data: calificaciones },
    { data: evaluaciones },
    { data: comunicados },
    { data: reportesDiarios },
    { data: matriculas },
    { data: planes },
    { data: objetivos },
    { data: sesiones },
    { data: evoluciones },
    { data: bitacora },
    { data: agendaSesiones },
    { data: programas },
    { data: inscripciones },
    { data: horarios },
    { data: tarifas },
    { data: cobrosSesion },
    { data: informes },
    { data: documentos },
  ] = await Promise.all([
    admin.from('colegios').select('*').eq('id', colegioId).single(),
    admin.from('alumnos').select('*').eq('colegio_id', colegioId).order('apellido'),
    admin.from('familias').select('*').eq('colegio_id', colegioId).order('apellido_apoderado'),
    admin.from('usuarios').select('id, email, nombre, apellido, rol, activo, created_at').eq('colegio_id', colegioId).order('apellido'),
    admin.from('cobros').select('*').eq('colegio_id', colegioId).order('anio', { ascending: false }).order('mes', { ascending: false }),
    admin.from('pagos').select('*').eq('colegio_id', colegioId).order('created_at', { ascending: false }),
    admin.from('asistencias').select('*').eq('colegio_id', colegioId).order('fecha', { ascending: false }),
    admin.from('calificaciones').select('*').eq('colegio_id', colegioId),
    admin.from('evaluaciones').select('*').eq('colegio_id', colegioId).order('fecha', { ascending: false }),
    admin.from('comunicados').select('*').eq('colegio_id', colegioId).order('created_at', { ascending: false }),
    admin.from('reportes_diarios').select('*').eq('colegio_id', colegioId).order('fecha', { ascending: false }),
    admin.from('matriculas').select('*').eq('colegio_id', colegioId).order('created_at', { ascending: false }),
    admin.from('planes_intervencion').select('*').eq('colegio_id', colegioId),
    admin.from('objetivos_terapeuticos').select('*,plan:planes_intervencion!inner(colegio_id)').eq('plan.colegio_id', colegioId),
    admin.from('sesiones_terapeuticas').select('*,plan:planes_intervencion!inner(colegio_id)').eq('plan.colegio_id', colegioId),
    admin.from('evoluciones').select('*,plan:planes_intervencion!inner(colegio_id)').eq('plan.colegio_id', colegioId),
    admin.from('bitacora_conductual').select('*,plan:planes_intervencion!inner(colegio_id)').eq('plan.colegio_id', colegioId),
    admin.from('agenda_sesiones').select('*').eq('colegio_id', colegioId),
    admin.from('programas').select('*').eq('colegio_id', colegioId),
    admin.from('inscripciones_programa').select('*').eq('colegio_id', colegioId),
    admin.from('horario_alumno').select('*').eq('colegio_id', colegioId),
    admin.from('tarifas_sesion').select('*').eq('colegio_id', colegioId),
    admin.from('cobros_sesion').select('*').eq('colegio_id', colegioId),
    admin.from('informes_terapeuticos').select('*').eq('colegio_id', colegioId),
    admin.from('documentos_alumno').select('*').eq('colegio_id', colegioId),
  ])

  const exportData = {
    exportado_at: new Date().toISOString(),
    plataforma: 'Kiva360',
    version: '1.0',
    colegio,
    datos: {
      alumnos: alumnos ?? [],
      familias: familias ?? [],
      usuarios: usuarios ?? [],
      cobros: cobros ?? [],
      pagos: pagos ?? [],
      asistencias: asistencias ?? [],
      calificaciones: calificaciones ?? [],
      evaluaciones: evaluaciones ?? [],
      comunicados: comunicados ?? [],
      reportes_diarios: reportesDiarios ?? [],
      matriculas: matriculas ?? [],
      planes_intervencion: planes ?? [],
      objetivos_terapeuticos: (objetivos ?? []).map((o: any) => { const { plan, ...rest } = o; return rest }),
      sesiones_terapeuticas: (sesiones ?? []).map((s: any) => { const { plan, ...rest } = s; return rest }),
      evoluciones: (evoluciones ?? []).map((e: any) => { const { plan, ...rest } = e; return rest }),
      bitacora_conductual: (bitacora ?? []).map((b: any) => { const { plan, ...rest } = b; return rest }),
      agenda_sesiones: agendaSesiones ?? [],
      programas: programas ?? [],
      inscripciones_programa: inscripciones ?? [],
      horario_alumno: horarios ?? [],
      tarifas_sesion: tarifas ?? [],
      cobros_sesion: cobrosSesion ?? [],
      informes_terapeuticos: informes ?? [],
      documentos_alumno: documentos ?? [],
    },
    resumen: {
      total_alumnos: (alumnos ?? []).length,
      total_familias: (familias ?? []).length,
      total_usuarios: (usuarios ?? []).length,
      total_asistencias: (asistencias ?? []).length,
      total_evaluaciones: (evaluaciones ?? []).length,
      total_cobros: (cobros ?? []).length,
      total_sesiones_terapeuticas: (sesiones ?? []).length,
      total_planes_intervencion: (planes ?? []).length,
    },
  }

  if (formato === 'csv') {
    // Generate multi-sheet CSV (pipe-separated sections)
    let csv = ''
    const tables = exportData.datos as Record<string, any[]>
    for (const [tableName, rows] of Object.entries(tables)) {
      if (rows.length === 0) continue
      csv += `\n=== ${tableName.toUpperCase()} (${rows.length} registros) ===\n`
      const headers = Object.keys(rows[0])
      csv += headers.join(',') + '\n'
      for (const row of rows) {
        csv += headers.map(h => {
          const val = (row as any)[h]
          if (val === null || val === undefined) return ''
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
          return str.includes(',') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str
        }).join(',') + '\n'
      }
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="kiva360-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  }

  // Default: JSON
  const jsonStr = JSON.stringify(exportData, null, 2)
  return new NextResponse(jsonStr, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="kiva360-export-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
