export default function PostularError({ mensaje }: { mensaje: string }) {
  return (
    <div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-50 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 className="text-[22px] font-bold text-[#1A1035] mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          No se pudo cargar el formulario
        </h1>
        <p className="text-[14px] text-[#5C5470] leading-relaxed mb-6">
          {mensaje}
        </p>
        <a href="https://kiva360.cl" className="text-[13px] font-medium text-[#0d1b2a] hover:underline">
          Ir a Kiva360
        </a>
      </div>
    </div>
  )
}
