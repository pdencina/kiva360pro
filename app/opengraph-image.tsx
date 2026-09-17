import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Kiva360 — Software de Gestión Educacional'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #1A1035 0%, #2D1B69 60%, #3d2580 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Glow decorativo */}
        <div
          style={{
            position: 'absolute',
            top: -150,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(91,62,158,0.45)',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -120,
            left: -80,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'rgba(232,93,58,0.25)',
            filter: 'blur(70px)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #5B3E9E, #E85D3A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
              fontWeight: 700,
              color: 'white',
            }}
          >
            K
          </div>
          <span style={{ fontSize: 40, fontWeight: 700, color: 'white' }}>Kiva360</span>
        </div>

        <div
          style={{
            fontSize: 68,
            fontWeight: 800,
            color: 'white',
            lineHeight: 1.1,
            letterSpacing: -1.5,
            maxWidth: 900,
          }}
        >
          Software de gestión educacional para colegios y jardines
        </div>

        <div
          style={{
            fontSize: 30,
            color: 'rgba(255,255,255,0.6)',
            marginTop: 32,
            maxWidth: 850,
            lineHeight: 1.4,
          }}
        >
          Matrículas, evaluación cualitativa, intervención NEE y reporte diario para las familias.
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 48,
            fontSize: 26,
            color: '#E85D3A',
            fontWeight: 600,
          }}
        >
          kiva360.cl
        </div>
      </div>
    ),
    { ...size }
  )
}
