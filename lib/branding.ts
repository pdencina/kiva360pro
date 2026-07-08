// ============================================================
// Configuración de Branding — Sistema de Gestión Educacional
// ============================================================
// Cambia estos valores para personalizar el sistema con la
// identidad de cualquier institución educativa.

export const BRANDING = {
  // Nombre de la plataforma
  appName: 'Kiva360',
  appNameShort: 'Kiva360',
  appNameUpper: 'KIVA360',

  // Organización / Institución
  orgName: 'Kiva360',
  orgLegal: 'Kiva360',
  orgFooter: 'Kiva360 · Gestión Educacional',

  // Versión
  version: 'v1.0',

  // Logo (ruta en /public)
  logoPath: '/logo.svg',
  logoAlt: 'Kiva360',

  // Email
  fromEmail: 'Kiva360 <notificaciones@kiva360.com>',
  emailPlaceholder: 'usuario@institucion.cl',

  // Metadata / SEO
  metaTitle: 'Kiva360 — Gestión Educacional',
  metaTitleTemplate: '%s | Kiva360',
  metaDescription: 'Plataforma integral de gestión escolar: comunicados, asistencias, calificaciones y cobranzas.',
  metaKeywords: ['gestión escolar', 'Kiva360', 'plataforma educacional', 'colegio', 'jardín infantil'],

  // Textos genéricos
  welcomeTitle: 'Gestión escolar integral',
  welcomeSubtitle: 'Administra comunicados, asistencias, calificaciones y cobranzas de manera centralizada y profesional.',
  loginSubtitle: 'Ingresa con tu cuenta institucional',

  // Contrato (textos legales genéricos para demo)
  contratoTitulo: 'CONTRATO DE PRESTACIÓN DE SERVICIOS EDUCACIONALES',
  contratoEntidad: 'CENTRO EDUCACIONAL',
  contratoRut: '00.000.000-0',
  contratoRepresentante: 'REPRESENTANTE LEGAL',
  contratoRepresentanteRut: '00.000.000-0',
  contratoDireccion: 'Dirección del establecimiento',
  contratoBanco: 'Banco',
  contratoCuenta: '000-0-000000-0',
  contratoEmailAdmin: 'admin@institucion.cl',
} as const

export type Branding = typeof BRANDING
