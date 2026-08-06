/**
 * Helper de permisos granulares para Kiva360
 * 
 * ROLES y sus accesos:
 * - super_admin: todo, sin restricciones
 * - admin: todo dentro de su colegio (incluye documentos confidenciales)
 * - pastor_campus: similar a admin pero sin config avanzada
 * - tutor: solo ve sus propios datos (sus sesiones, sus alumnos asignados, sus reportes)
 * - apoderado: solo ve datos de su hijo marcados como visible_familia
 * - alumno: solo ve sus propios datos básicos
 */

export type Rol = 'super_admin' | 'admin' | 'pastor_campus' | 'gestor_admision' | 'tutor' | 'apoderado' | 'alumno'

export interface PermisoConfig {
  rol: Rol
  userId: string
  colegioId: string | null
}

// ¿Es director/admin con acceso total?
export function esDirector(rol: string): boolean {
  return ['super_admin', 'admin'].includes(rol)
}

// ¿Puede ver datos de todos los profesionales?
export function veeTodosLosProfesionales(rol: string): boolean {
  return ['super_admin', 'admin', 'pastor_campus'].includes(rol)
}

// ¿Es profesional (terapeuta/tutor)?
export function esProfesional(rol: string): boolean {
  return ['tutor', 'pastor_campus'].includes(rol)
}

// ¿Puede acceder al módulo de documentos confidenciales?
export function accesoDocumentosConfidenciales(rol: string): boolean {
  return ['super_admin', 'admin'].includes(rol)
}

// ¿Puede editar/crear datos?
export function puedeEditar(rol: string): boolean {
  return ['super_admin', 'admin', 'pastor_campus', 'tutor'].includes(rol)
}

// ¿Puede eliminar datos?
export function puedeEliminar(rol: string): boolean {
  return ['super_admin', 'admin'].includes(rol)
}

// ¿Puede gestionar cobranzas y pagos?
export function accesoFinanzas(rol: string): boolean {
  return ['super_admin', 'admin', 'pastor_campus'].includes(rol)
}

// ¿Puede ver configuración y usuarios?
export function accesoConfiguracion(rol: string): boolean {
  return ['super_admin', 'admin', 'pastor_campus'].includes(rol)
}

/**
 * Filtro para sesiones terapéuticas:
 * - Director/admin ve todas las sesiones del colegio
 * - Tutor solo ve las sesiones donde él es el profesional
 */
export function filtroSesionProfesional(rol: string, userId: string): { profesional_id?: string } {
  if (veeTodosLosProfesionales(rol)) return {}
  return { profesional_id: userId }
}

/**
 * Filtro para agenda:
 * - Director/admin ve toda la agenda del colegio
 * - Tutor solo ve sus propias citas
 */
export function filtroAgendaProfesional(rol: string, userId: string): { profesional_id?: string } {
  if (veeTodosLosProfesionales(rol)) return {}
  return { profesional_id: userId }
}

/**
 * Módulos visibles por rol (para permisos iniciales)
 * Usado cuando no hay registros en permisos_rol
 */
export const MODULOS_POR_ROL: Record<string, string[]> = {
  super_admin: [], // null = ve todo
  admin: [
    'inicio', 'matricula', 'alumnos', 'programas', 'horarios', 'planificacion',
    'asistencias', 'evaluaciones', 'comunicados', 'mensajes', 'libro_clases',
    'intervencion', 'agenda', 'reporte_diario', 'tareas', 'cobranzas',
    'documentos', 'calendario', 'fichas', 'reportes',
  ],
  pastor_campus: [
    'inicio', 'matricula', 'alumnos', 'programas', 'horarios', 'planificacion',
    'asistencias', 'evaluaciones', 'comunicados', 'mensajes', 'libro_clases',
    'intervencion', 'agenda', 'reporte_diario', 'tareas', 'cobranzas',
    'documentos', 'calendario', 'fichas', 'reportes',
  ],
  tutor: [
    'inicio', 'alumnos', 'planificacion', 'asistencias', 'evaluaciones',
    'comunicados', 'mensajes', 'libro_clases', 'intervencion', 'agenda',
    'reporte_diario', 'tareas', 'fichas',
  ],
  apoderado: [
    'inicio', 'intervencion', 'agenda', 'reporte_diario', 'comunicados',
    'mensajes', 'asistencias', 'evaluaciones', 'pagos', 'documentos', 'perfil',
  ],
  alumno: [
    'inicio', 'evaluaciones', 'asistencias', 'tareas', 'comunicados', 'perfil',
  ],
}
