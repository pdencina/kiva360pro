import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#1A1035] border-t border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-6 py-10 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/icono-solo/kiva360-icon.svg" alt="Kiva360" className="w-9 h-9 rounded-[10px]" />
              <span className="font-display font-bold text-lg text-white tracking-tight">
                Kiva360
              </span>
            </div>
            <p className="text-[13px] text-white/40 leading-relaxed max-w-xs">
              Plataforma integral de gestión educacional para colegios chilenos.
            </p>
          </div>

          {/* Links */}
          <div>
            <div className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em] mb-4">
              Plataforma
            </div>
            <ul className="space-y-2.5">
              {['Funcionalidades', 'Módulos', 'Planes', 'Seguridad'].map(item => (
                <li key={item}>
                  <a href="#" className="text-[13px] text-white/50 hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em] mb-4">
              Recursos
            </div>
            <ul className="space-y-2.5">
              {['Centro de ayuda', 'Documentación', 'Estado del servicio', 'Changelog'].map(item => (
                <li key={item}>
                  <a href="#" className="text-[13px] text-white/50 hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em] mb-4">
              Contacto
            </div>
            <ul className="space-y-2.5">
              <li><a href="mailto:contacto@kiva360.cl" className="text-[13px] text-white/50 hover:text-white transition-colors">contacto@kiva360.cl</a></li>
              <li><a href="https://wa.me/56936902642" className="text-[13px] text-white/50 hover:text-white transition-colors">+56 9 3690 2642</a></li>
              <li><span className="text-[13px] text-white/50">Santiago, Chile</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-white/30">
            &copy; {new Date().getFullYear()} Kiva360. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-[11px] text-white/30 hover:text-white/60 transition-colors">Política de privacidad</a>
            <a href="#" className="text-[11px] text-white/30 hover:text-white/60 transition-colors">Términos de servicio</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
