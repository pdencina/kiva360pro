import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST: Registrar usuario postulante (signup público)
export async function POST(request: NextRequest) {
  const admin = getAdmin()
  const body = await request.json()

  const { email, password, nombre, apellido, colegio_id } = body

  // Validaciones
  if (!email || !password || !nombre || !colegio_id) {
    return NextResponse.json({ error: 'Email, contraseña, nombre y colegio son requeridos' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  // Verificar que el colegio existe
  const { data: colegio } = await admin.from('colegios').select('id').eq('id', colegio_id).single()
  if (!colegio) {
    return NextResponse.json({ error: 'Centro educativo no encontrado' }, { status: 404 })
  }

  // Verificar si el email ya existe como usuario
  const { data: existingUser } = await admin.from('usuarios').select('id').eq('email', email).single()
  if (existingUser) {
    return NextResponse.json({ error: 'Ya existe una cuenta con este correo. Intenta iniciar sesión.' }, { status: 409 })
  }

  // Crear usuario en auth
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Confirmamos el email inmediatamente
  })

  if (authError) {
    console.error('Error creating auth user:', authError)
    if (authError.message?.includes('already been registered')) {
      return NextResponse.json({ error: 'Ya existe una cuenta con este correo. Intenta iniciar sesión.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 })
  }

  // Crear registro en tabla usuarios con rol 'postulante'
  const { error: userError } = await admin.from('usuarios').insert({
    id: authData.user.id,
    colegio_id: colegio_id,
    email,
    nombre,
    apellido: apellido || '',
    rol: 'postulante',
    activo: true,
  })

  if (userError) {
    console.error('Error creating usuario record:', userError)
    // Limpiar el auth user si falla
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    user_id: authData.user.id,
    message: 'Cuenta creada exitosamente',
  }, { status: 201 })
}
