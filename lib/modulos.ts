/**
 * Gating comercial de add-ons vendidos aparte del plan base de Kiva360
 * (ej: "Finanzas y Facturación", "Kiva360 Salud"). No reemplaza
 * `lib/permisos.ts` — permisos.ts gatea POR ROL dentro de un colegio que
 * ya tiene el módulo contratado; esto gatea si el colegio contrató el
 * módulo en absoluto, independiente del rol.
 */

export type ModuloAddOn = 'finanzas' | 'salud'

export function tieneModulo(modulosActivos: string[] | null | undefined, modulo: ModuloAddOn): boolean {
  return Array.isArray(modulosActivos) && modulosActivos.includes(modulo)
}
