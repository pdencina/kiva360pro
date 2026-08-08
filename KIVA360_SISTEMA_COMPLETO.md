# KIVA360 — Documentación Completa del Sistema

## Qué es Kiva360
Plataforma SaaS de gestión educacional integral para jardines, colegios y centros de educación diferencial (NEE) en Chile. Desarrollada por Flexio Technologies Spa (RUT 78.479.402-4). Funciona como app web responsive (móvil + desktop).

**URL:** https://kiva360.cl
**Stack:** Next.js 14 + Supabase + Tailwind CSS + Vercel
**Contacto:** pablo@kiva360.cl · +56 9 4961 6038

---

## Arquitectura Técnica

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion
- **Backend:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Deploy:** Vercel (región GRU1 — São Paulo)
- **Pagos:** Mercado Pago (suscripciones recurrentes), Transbank Webpay/Oneclick
- **Emails:** Resend
- **Storage:** Supabase Storage (bucket "documentos")

---

## Roles del Sistema

| Rol | Acceso | Descripción |
|-----|--------|-------------|
| `super_admin` | `/super-admin`, todo | Pablo (dueño de Kiva360). Gestiona todos los colegios, suscripciones, propuestas |
| `admin` | `/inicio`, dashboard completo | Administrador del colegio. Ve todo su colegio |
| `gestor_admision` | Admisión, matrícula, alumnos | Gestiona pipeline de admisión |
| `tutor` | Alumnos, planificación, intervención | Profesional (fonoaudióloga, psicóloga, educadora) |
| `apoderado` | `/portal` | Padre/madre. Ve avances, pagos, comunicados de su hijo |
| `alumno` | `/portal` | Alumno. Ve calificaciones, tareas, comunicados |
| `postulante` | `/portal/postulacion` | Apoderado que postuló pero no está matriculado aún |

---

## Módulos del Sistema

### 1. ADMISIÓN Y MATRÍCULA

**Formulario de postulación pública (`/postular?c=colegioId`)**
- Ruta pública sin autenticación
- Campos: datos apoderado, datos alumno, diagnóstico, programa de interés
- Upload de 8 documentos: CI alumno (frente/reverso), foto alumno, CI apoderado (frente/reverso), certificado nacimiento, cuenta servicio básico, certificado médico
- Documentos se suben a Supabase Storage → `postulaciones/{colegioId}/{timestamp}/{tipo}.ext`
- URLs se guardan en `prospectos.metadata.documentos`

**Portal del postulante (`/portal/postulacion`)**
- El apoderado se registra con email + contraseña (rol `postulante`)
- Después de registrarse ve el formulario de postulación
- Puede hacer seguimiento del estado: Recibida → En revisión → Entrevista → En decisión → Aprobada
- Ve sus documentos enviados

**Pipeline de admisión (admin: `/admision`)**
- Vista Kanban con etapas: Nuevas, Contactadas, Visita agendada, En decisión, Aprobadas, Rechazadas
- Panel de detalle con datos del postulante + documentos adjuntos (thumbnails)
- Botón "Copiar link admisión" genera `/postular?c={colegioId}`
- Mover postulaciones entre etapas con un clic

**Matrícula (`/matricula`)**
- Formulario completo: datos alumno, familia, plan de cobro, documentos
- Genera automáticamente: contrato de servicio + pagaré
- Opciones de pago: transferencia (5% dcto), tarjeta, cheques, pagaré

**Firma digital de contratos (`/matricula/firmar/[id]`)**
- Apoderado firma contrato y pagaré con firma electrónica simple
- Validez legal: Ley 19.799 Chile
- Registro de auditoría: IP, user-agent, timestamp, hash SHA-256 del documento
- Notificación email a pablo@kiva360.cl cuando se firma

---

### 2. GESTIÓN DE ALUMNOS

**Alumnos (`/alumnos`)**
- CRUD completo: nombre, apellido, RUT, fecha nacimiento, curso, nivel, foto
- Filtros por curso, nivel, estado (activo/inactivo)
- Vista detalle con toda la info del alumno

**Fichas pedagógicas (`/fichas`)**
- Ejercicios, evaluaciones, cuentos, manualidades, guías
- Categorización por materia y grado
- Descarga y valoración

---

### 3. INTERVENCIÓN NEE (Necesidades Educativas Especiales)

**Plan de Intervención Individual (`/intervencion/[id]`)**
- Objetivos terapéuticos con progreso medible (0-100%)
- Equipo multidisciplinario asignado (fonoaudióloga, TO, psicóloga)
- Sesiones con registro de asistencia y observaciones
- Bitácora conductual (modelo ABC: Antecedente, Conducta, Consecuencia)
- Evoluciones periódicas

**Informes terapéuticos**
- Subidos por profesionales del equipo
- Tipos: ingreso, periódico, avance, alta, derivación
- Opcionales: visibles a la familia o solo al director

---

### 4. AGENDA Y HORARIOS

**Agenda de sesiones (`/agenda`)**
- Calendario semanal para citas terapéuticas
- Recurrencia automática
- Vista para profesionales y familias

**Horario individual por alumno (`/horario-alumno`)**
- Cada alumno tiene su propio horario personalizado
- Bloques configurables por día y hora
- Vista para apoderados en el portal

---

### 5. ASISTENCIA Y EVALUACIONES

**Asistencia (`/asistencias`)**
- Control por bloque horario
- Estados: presente, ausente, atrasado, justificado
- Alertas automáticas a apoderados
- Reportes de inasistencia acumulada

**Calificaciones (`/calificaciones`)**
- Libro de clases digital
- Promedios automáticos
- Informes por alumno
- Exportación PDF (boletín)

---

### 6. PROGRAMAS Y PLANIFICACIÓN

**Programas (`/programas`)**
- Educativo Intensivo, After School, Sesiones Individuales, Evaluación
- Cada programa tiene: cupos, horarios, costos, inscripciones

**Planificación (`/planificacion`)**
- Planificación curricular por programa/curso
- Asignación de contenidos y actividades

---

### 7. COMUNICACIÓN

**Comunicados (`/comunicados`)**
- Envío masivo a apoderados (por curso, nivel, o todos)
- Tipos: informativo, urgente, evento, reunión

**Mensajería directa (`/mensajes`)**
- Chat entre profesionales y apoderados
- SLA configurable para tiempos de respuesta
- Contador de mensajes no leídos en sidebar

**Reporte diario (`/reporte-diario`)**
- Actividades del día por alumno
- Fotos y observaciones
- Visible para apoderados en su portal

---

### 8. COBRANZA Y PAGOS

**Aportes/Contable (`/contable`)**
- Dashboard de ingresos: recaudado vs pendiente vs atrasado
- Registro de pagos: transferencia, Webpay, efectivo, cheque
- Exportación de datos

**Cobranza (`/cobranza`)**
- Vista de morosidad
- Avisos automáticos de cobro por email
- Historial de pagos por familia

**Cobros por sesión (`/cobros-sesion`)**
- Para centros que cobran por sesión individual
- Tarifas configurables por profesional/tipo
- Paquetes con descuento (ej: 10 sesiones)

**Portal de pagos del apoderado (`/portal/pagos`)**
- Ve sus cobros pendientes y pagados
- Puede pagar con Webpay (tarjeta)
- Puede inscribir tarjeta con Oneclick (cobro automático)
- Reportar transferencia con comprobante

**Página de pago pública (`/pago/[token]`)**
- Link de pago enviado por email/WhatsApp
- Pago con Webpay sin necesidad de login

---

### 9. BILLING SaaS (Kiva360 cobra a los colegios)

**Vista super_admin (`/super-admin/suscripciones`)**
- Lista de todos los colegios con: plan, monto, estado, vencimiento, meses pagados
- Crear nuevas suscripciones
- Registrar pagos manuales (transferencia)
- Stats: total clientes, activas, atrasadas, ingreso mensual

**Vista del colegio (`/configuracion/suscripcion`)**
- Plan actual, monto mensual, próximo vencimiento
- Botón "Suscribir tarjeta" → Mercado Pago (cobro automático mensual)
- Datos bancarios de Flexio Technologies Spa para transferencia manual
- Historial de pagos

**Mercado Pago Suscripciones**
- Integración completa con PreApproval API
- Cobro automático mensual con tarjeta
- Webhook para registrar pagos automáticamente
- Verificación de firma con HMAC SHA-256

**Datos bancarios para cobro:**
- Flexio Technologies Spa
- RUT: 78.479.402-4
- Banco: Bci
- Cuenta Corriente: 68569265
- Email: pablo@flexio.cl

---

### 10. PROPUESTAS COMERCIALES

**Generación de propuestas (`/super-admin/propuestas/nueva`)**
- Genera página pública: `/propuesta/[slug]`
- Incluye: plan, precio, módulos incluidos, condiciones de servicio
- Modalidad mensual o anual (10% dcto)

**Firma electrónica de propuesta**
- Cliente recibe código de verificación por email
- Ingresa código + nombre → firma la propuesta
- Se envía email de confirmación al cliente
- Se envía email de notificación a pablo@kiva360.cl

---

### 11. PORTAL DEL APODERADO (`/portal`)

Vista completa para familias con:
- Inicio con resumen (asistencia, promedio, deuda, comunicados)
- Avances de intervención terapéutica
- Informes del equipo profesional
- Agenda de sesiones
- Horario del alumno
- Reporte del día
- Mensajes directos con profesionales
- Comunicados del colegio
- Documentos
- Asistencias
- Evaluaciones/calificaciones
- Estado de pagos + pago online
- Mi perfil
- Firma de contratos pendientes

---

### 12. CONFIGURACIÓN

**General (`/configuracion`)**
- Datos del colegio (nombre, logo, dirección)
- Horarios de jornada
- Períodos académicos

**Permisos (`/configuracion/permisos`)**
- Configurar qué módulos ve cada rol
- Granularidad por módulo

**Contratos (`/configuracion/contratos`)**
- Plantillas de contrato personalizables (editor Tiptap)
- Variables dinámicas: nombre, RUT, sede, montos, etc.

**Suscripción (`/configuracion/suscripcion`)**
- Plan, pagos, datos para transferir a Flexio

---

### 13. SUPER ADMIN (`/super-admin`)

Panel de control de Pablo (dueño):
- Dashboard con stats globales (colegios, alumnos, usuarios, propuestas, MRR)
- Gestión de colegios (crear, editar, impersonar)
- Gestión de usuarios globales
- Tabla de aportes (precios por nivel/jornada)
- Suscripciones/billing
- Propuestas comerciales
- Permisos globales

---

## Base de Datos (tablas principales)

| Tabla | Descripción |
|-------|-------------|
| `colegios` | Centros educacionales clientes |
| `usuarios` | Todos los usuarios (auth.users + datos) |
| `alumnos` | Alumnos matriculados |
| `familias` | Apoderados vinculados a alumnos |
| `matriculas` | Registro de matrícula con firma y contrato |
| `prospectos` | Pipeline de admisión (leads/postulaciones) |
| `asistencias` | Registro diario de asistencia |
| `calificaciones` | Notas y evaluaciones |
| `comunicados` | Comunicados enviados |
| `conversaciones` / `mensajes` | Mensajería directa |
| `cobros` | Cobros mensuales a familias |
| `pagos` | Pagos registrados |
| `planes_intervencion` | Planes NEE por alumno |
| `objetivos_intervencion` | Objetivos terapéuticos |
| `sesiones_intervencion` | Sesiones registradas |
| `evoluciones` | Evoluciones/avances terapéuticos |
| `programas` | Programas educativos ofrecidos |
| `inscripciones_programa` | Alumnos inscritos a programas |
| `horarios_alumno` | Horario individual por alumno |
| `agenda_sesiones` | Citas agendadas |
| `reportes_diarios` | Actividades del día por alumno |
| `documentos_alumno` | Documentos escaneados del alumno |
| `informes_terapeuticos` | Informes del equipo profesional |
| `suscripciones` | Billing: suscripción del colegio a Kiva360 |
| `pagos_suscripcion` | Historial de pagos de suscripción |
| `propuestas` | Propuestas comerciales generadas |
| `permisos_rol` | Configuración de módulos por rol |

---

## Seguridad

- **RLS (Row Level Security):** Cada tabla tiene policies que limitan acceso al `colegio_id` del usuario
- **Función `mi_colegio_id()`:** Retorna el colegio del usuario autenticado para RLS
- **Service Role Key:** Usada solo en server-side para operaciones admin
- **Firma digital:** Ley 19.799, con hash SHA-256, IP, user-agent, timestamp
- **Webhook Mercado Pago:** Verificación HMAC SHA-256 de firma

---

## Integraciones

| Servicio | Uso |
|----------|-----|
| Supabase Auth | Autenticación email/password |
| Supabase Storage | Upload de documentos y fotos |
| Mercado Pago | Suscripciones recurrentes (billing SaaS) |
| Transbank Webpay | Pagos de apoderados con tarjeta |
| Transbank Oneclick | Inscripción de tarjeta para cobro automático |
| Resend | Envío de emails (comunicados, códigos, notificaciones) |
| Kommo CRM | Webhook para importar leads de admisión |

---

## Flujos Principales

### Flujo de Admisión
1. Familia entra a `/postular?c=colegioId`
2. Se registra con email (crea cuenta `postulante`)
3. Completa formulario + sube documentos
4. Postulación cae al pipeline del admin (`/admision`)
5. Admin mueve por etapas: Revisión → Entrevista → Aprobada
6. Postulante ve el avance en `/portal/postulacion`
7. Si aprobada → se crea matrícula

### Flujo de Matrícula
1. Admin crea matrícula en `/matricula`
2. Se genera contrato + pagaré automáticamente
3. Se envía link de firma al apoderado
4. Apoderado firma digitalmente
5. Se registran cobros mensuales automáticamente
6. Apoderado paga desde `/portal/pagos`

### Flujo de Billing (colegio paga a Kiva360)
1. Super_admin crea suscripción del colegio
2. Admin del colegio va a `/configuracion/suscripcion`
3. Hace clic en "Suscribir tarjeta"
4. Se redirige a Mercado Pago → inscribe tarjeta
5. MP cobra automáticamente los 30 de cada mes
6. Webhook registra el pago en el sistema
7. Super_admin ve todo en `/super-admin/suscripciones`

### Flujo de Propuesta Comercial
1. Super_admin crea propuesta para un prospecto
2. Se genera link público: `/propuesta/sakura-kids`
3. Cliente ve plan, precio, módulos, condiciones
4. Hace clic en "Firmar propuesta"
5. Recibe código por email → firma con su nombre
6. Pablo recibe email: "Propuesta FIRMADA"
7. Se crea el colegio + suscripción

---

## Mobile / PWA

- Sidebar responsive: hamburger (☰) en topbar para mobile, drawer desde la izquierda
- Meta tags PWA: instalable como app en iOS y Android
- CSS anti-zoom iOS: inputs a 16px
- Touch feedback: active:scale-95 en botones
- Modales: sheet desde abajo en mobile, centrados en desktop
- Tablas: scroll horizontal en mobile
- Todo con Tailwind breakpoints: `md:` y `lg:`

---

## Landing Page (kiva360.cl)

- Hero con gradiente + CTA a WhatsApp
- Features grid (12 funcionalidades destacadas)
- Pipeline de admisión animado (tarjetas moviéndose entre etapas en tiempo real)
- Stats de confianza
- Módulos detallados
- Pricing (Básico / Profesional / Enterprise)
- CTA final con WhatsApp + email
- Footer con contacto

---

## Clientes Actuales

- Espacio Integral Sakura Kids (Santiago)
- AR School Global (Santiago, Puente Alto, Punta Arenas)

---

## Planes y Precios

| Plan | Target | Incluye |
|------|--------|---------|
| Básico | Jardines pequeños | Alumnos, asistencia, comunicados |
| Profesional | Colegios y centros NEE | Todo: intervención, programas, cobros, portal |
| Enterprise | Redes de colegios | Multi-sede, API, soporte prioritario |

Pricing personalizado según necesidades del cliente.
