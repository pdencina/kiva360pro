import type { SupabaseClient } from '@supabase/supabase-js'

interface RegistrarAuditoriaInput {
  admin: SupabaseClient
  colegioId: string
  usuarioId: string | null
  accion: string
  entidad: string
  entidadId?: string | null
  valorAnterior?: Record<string, unknown> | null
  valorNuevo?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

/**
 * Registra un evento en el log de auditoría financiera. Se usa desde
 * cualquier endpoint que modifique montos, anule cobros, aplique
 * descuentos, emita documentos tributarios o cambie configuración
 * tributaria. Nunca lanza si falla el insert de auditoría — no queremos
 * que un problema de logging tumbe la operación financiera real, pero sí
 * lo dejamos en consola para monitoreo.
 */
export async function registrarAuditoriaFinanciera(input: RegistrarAuditoriaInput): Promise<void> {
  const { admin, colegioId, usuarioId, accion, entidad, entidadId, valorAnterior, valorNuevo, metadata } = input
  try {
    await admin.from('log_auditoria_financiera').insert({
      colegio_id: colegioId,
      usuario_id: usuarioId,
      accion,
      entidad,
      entidad_id: entidadId ?? null,
      valor_anterior: valorAnterior ?? null,
      valor_nuevo: valorNuevo ?? null,
      metadata: metadata ?? null,
    })
  } catch (err) {
    console.error('Error registrando auditoría financiera:', err)
  }
}
