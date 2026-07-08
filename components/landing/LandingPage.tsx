import Link from 'next/link'
import Image from 'next/image'

const STATS = [
  { value: '48 hrs', label: 'puesta en marcha promedio', color: 'text-blue-600' },
  { value: '35+', label: 'horas de ahorro mensual en gestión', color: 'text-amber-500' },
  { value: '99.9%', label: 'disponibilidad garantizada', color: 'text-emerald-600' },
  { value: '$29.990', label: 'precio desde (CLP/mes)', color: 'text-rose-500' },
]

const MODULOS_ACADEMICO = [
  { icon: 'ti-clipboard-check', title: 'Asistencia Digital', desc: 'Registro diario con un click. Sin cuadernos ni papel.' },
  { icon: 'ti-chart-bar', title: 'Evaluaciones', desc: 'Calificaciones por porcentaje de logro o notas tradicionales.' },
  { icon: 'ti-notebook', title: 'Libro de Clases', desc: 'Registro digital de contenidos y observaciones por sesión.' },
  { icon: 'ti-layout-board', title: 'Planificación', desc: 'Planificaciones semanales por curso y materia.' },
  { icon: 'ti-clock', title: 'Horarios', desc: 'Grilla visual semanal configurable por curso.' },
  { icon: 'ti-clipboard-heart', title: 'Reporte Diario', desc: 'Alimentación, siesta, ánimo y actividades. Llega al apoderado al instante.' },
]

const MODULOS_ADMIN = [
  { icon: 'ti-user-plus', title: 'Matrícula Digital', desc: 'Proceso completo: datos, contrato y firma electrónica.' },
  { icon: 'ti-cash', title: 'Cobranzas', desc: 'Panel completo con estados, avisos automáticos y pago online.' },
  { icon: 'ti-credit-card', title: 'Pago Online', desc: 'Los apoderados pagan con tarjeta directo desde el portal.' },
  { icon: 'ti-file-analytics', title: 'Reportes', desc: 'Estadísticas en tiempo real de asistencia, pagos y rendimiento.' },
  { icon: 'ti-folder', title: 'Documentos', desc: 'Repositorio digital: protocolos, actas y material pedagógico.' },
  { icon: 'ti-calendar', title: 'Calendario', desc: 'Eventos, evaluaciones y feriados en un solo lugar.' },
]

const PORTAL_FEATURES = [
  { icon: 'ti-device-mobile', title: 'Apoderados', desc: 'Ven reportes, asistencia, evaluaciones y pagan online desde el celular. Sin instalar nada.' },
  { icon: 'ti-message-2', title: 'Mensajería', desc: 'Comunicación directa entre staff y familias. Controlada y con registro.' },
  { icon: 'ti-speakerphone', title: 'Comunicados', desc: 'Avisos masivos por curso o todo el colegio. Se acabó el "no me llegó la libreta".' },
  { icon: 'ti-palette', title: 'Personalizable', desc: 'Logo y colores de tu establecimiento. Cada colegio se siente en su propia plataforma.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-lg border-b border-slate-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="Kiva360" width={32} height={32} className="rounded-lg"/>
            <span className="font-bold text-[#1a2332] text-lg tracking-tight" style={{ fontFamily: 'DM Sans, sans-serif' }}>Kiva360</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#sistema" className="hover:text-[#1a2332] transition-colors">Sistema</a>
            <a href="#precios" className="hover:text-[#1a2332] transition-colors">Precios</a>
            <a href="#contacto" className="hover:text-[#1a2332] transition-colors">Contacto</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-600 hover:text-[#1a2332] transition-colors hidden sm:block">Iniciar sesión</Link>
            <a href="#contacto" className="px-4 py-2 bg-[#1a2332] text-white text-sm font-semibold rounded-lg hover:bg-[#2a3d52] transition-colors">
              Solicitar demo
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-[#0a1628] via-[#1a2332] to-[#0f1b2d] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5"/>
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl"/>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl"/>
        <div className="max-w-6xl mx-auto relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-white/70 text-xs font-medium mb-6 backdrop-blur-sm border border-white/10">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"/>
              Plataforma 100% operativa
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Gestión integral para<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">jardines, preschool y colegios</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-lg">
              Centraliza comunicados, asistencia, evaluaciones, cobranzas y el reporte diario de cada niño en un solo sistema. Los apoderados acceden desde el celular.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#contacto" className="px-6 py-3 bg-white text-[#1a2332] font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm">
                Agendar demostración gratuita
              </a>
              <a href="#sistema" className="px-6 py-3 border border-white/20 text-white/80 font-medium rounded-lg hover:bg-white/5 transition-colors text-sm">
                Ver funcionalidades →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-b border-slate-100">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <div className={`text-3xl md:text-4xl font-bold ${s.color} mb-2`} style={{ fontFamily: 'DM Sans, sans-serif' }}>{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Banner promo */}
      <section className="bg-amber-50 border-y border-amber-100 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 text-sm">
          <span className="text-amber-700 font-semibold">🚀 Prueba gratis por 30 días.</span>
          <span className="text-amber-600">Sin compromiso, sin tarjeta de crédito. Todos los módulos incluidos.</span>
        </div>
      </section>

      {/* Sistema - Gestión Académica */}
      <section id="sistema" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1a2332] mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>Gestión Académica</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Todo lo que necesitan educadoras, profesores y dirección para gestionar el día a día pedagógico.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {MODULOS_ACADEMICO.map((m, i) => (
              <div key={i} className="p-6 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <i className={`ti ${m.icon} text-xl text-blue-600`} aria-hidden="true"/>
                </div>
                <h3 className="font-semibold text-[#1a2332] mb-1.5">{m.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sistema - Gestión Administrativa */}
      <section className="py-20 px-6 bg-[#f8f9fb]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1a2332] mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>Gestión Administrativa</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Controla matrículas, pagos, documentos y reportes de forma eficiente y profesional.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {MODULOS_ADMIN.map((m, i) => (
              <div key={i} className="p-6 rounded-xl bg-white border border-slate-100 hover:shadow-sm transition-all group">
                <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                  <i className={`ti ${m.icon} text-xl text-emerald-600`} aria-hidden="true"/>
                </div>
                <h3 className="font-semibold text-[#1a2332] mb-1.5">{m.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portal & Comunicación */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1a2332] mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>Portal de Familias y Comunicación</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Los apoderados acceden desde cualquier dispositivo. Sin instalar apps, sin WhatsApp desordenado.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PORTAL_FEATURES.map((m, i) => (
              <div key={i} className="text-center p-6 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <i className={`ti ${m.icon} text-2xl text-violet-600`} aria-hidden="true"/>
                </div>
                <h3 className="font-semibold text-[#1a2332] mb-2">{m.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciador: Reporte Diario */}
      <section className="py-20 px-6 bg-gradient-to-br from-amber-50 to-orange-50 border-y border-amber-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 rounded-full text-amber-700 text-xs font-semibold mb-4">
              ⭐ Exclusivo para jardines y preschool
            </div>
            <h2 className="text-3xl font-bold text-[#1a2332] mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>Reporte Diario del Niño</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              La educadora registra en minutos cómo le fue al niño: qué comió, si durmió siesta, su estado de ánimo, actividades realizadas y observaciones. El apoderado lo recibe en su celular al instante.
            </p>
            <ul className="space-y-3">
              {['Alimentación (desayuno, almuerzo, snack)', 'Siesta y minutos dormidos', 'Estado emocional del día', 'Actividades realizadas', 'Observaciones y salud'].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ti ti-check text-[10px] text-amber-800" aria-hidden="true"/>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 max-w-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-lg">👶</div>
                <div>
                  <div className="font-semibold text-sm text-[#1a2332]">Sofía Martínez</div>
                  <div className="text-xs text-slate-400">Pre-Kinder · Hoy 16:30</div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">🍽️ Almuerzo</span><span className="font-medium text-emerald-600">Comió todo</span></div>
                <div className="flex justify-between"><span className="text-slate-500">😴 Siesta</span><span className="font-medium">45 min</span></div>
                <div className="flex justify-between"><span className="text-slate-500">😊 Ánimo</span><span className="font-medium text-amber-600">Feliz</span></div>
                <div className="flex justify-between"><span className="text-slate-500">🎨 Actividades</span><span className="font-medium">Arte, Música</span></div>
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  💬 &quot;Sofía participó mucho en la actividad de arte. Compartió materiales con sus compañeros.&quot;
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Precios */}
      <section id="precios" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1a2332] mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>Planes simples y transparentes</h2>
            <p className="text-slate-500">Sin letra chica. Sin contratos de permanencia. Todos los módulos incluidos.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Starter', alumnos: 'Hasta 50 alumnos', precio: '$29.990', ideal: 'Jardines pequeños' },
              { name: 'Pro', alumnos: 'Hasta 150 alumnos', precio: '$49.990', ideal: 'Jardines y preschool', popular: true },
              { name: 'Enterprise', alumnos: 'Ilimitado + multi-sede', precio: '$89.990', ideal: 'Colegios y redes' },
            ].map((plan, i) => (
              <div key={i} className={`p-6 rounded-xl border ${plan.popular ? 'border-[#1a2332] ring-1 ring-[#1a2332]' : 'border-slate-200'} relative`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#1a2332] text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                    Más elegido
                  </div>
                )}
                <h3 className="font-bold text-lg text-[#1a2332] mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-400 mb-4">{plan.ideal}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-[#1a2332]" style={{ fontFamily: 'DM Sans, sans-serif' }}>{plan.precio}</span>
                  <span className="text-sm text-slate-400"> /mes + IVA</span>
                </div>
                <p className="text-sm text-slate-500 mb-5">{plan.alumnos}</p>
                <ul className="space-y-2 mb-6">
                  {['Todos los módulos', 'Portal de apoderados', 'Pago online', 'Soporte WhatsApp', 'Setup incluido'].map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="ti ti-check text-emerald-500 text-xs" aria-hidden="true"/> {f}
                    </li>
                  ))}
                </ul>
                <a href="#contacto" className={`block text-center py-2.5 rounded-lg font-semibold text-sm transition-colors ${plan.popular ? 'bg-[#1a2332] text-white hover:bg-[#2a3d52]' : 'border border-slate-200 text-[#1a2332] hover:bg-slate-50'}`}>
                  Solicitar demo
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Contacto */}
      <section id="contacto" className="py-20 px-6 bg-[#0a1628]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>¿Listo para profesionalizar tu gestión?</h2>
          <p className="text-white/60 mb-8">Agenda una demo gratuita de 15 minutos. Te mostramos cómo funciona con datos reales de tu establecimiento.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://wa.me/56977482945?text=Hola%2C%20me%20interesa%20una%20demo%20de%20Kiva360" target="_blank" rel="noopener"
              className="px-6 py-3.5 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors inline-flex items-center justify-center gap-2">
              <i className="ti ti-brand-whatsapp text-lg" aria-hidden="true"/> WhatsApp directo
            </a>
            <a href="mailto:pablo@kiva360.com"
              className="px-6 py-3.5 border border-white/20 text-white font-medium rounded-lg hover:bg-white/5 transition-colors inline-flex items-center justify-center gap-2">
              <i className="ti ti-mail text-lg" aria-hidden="true"/> pablo@kiva360.com
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Kiva360" width={24} height={24} className="rounded"/>
            <span className="text-sm font-semibold text-slate-700">Kiva360</span>
          </div>
          <p className="text-xs text-slate-400">© 2026 Kiva360. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs text-slate-500 hover:text-[#1a2332]">Acceso plataforma</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
