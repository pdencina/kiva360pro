'use client'

interface Props {
  colorPrimario?: string | null
  colorAcento?: string | null
}

/**
 * Inyecta CSS variables dinámicas basadas en el branding del colegio.
 * Si el colegio no tiene colores definidos, usa los defaults del tema.
 */
export default function ColegioTheme({ colorPrimario, colorAcento }: Props) {
  if (!colorPrimario && !colorAcento) return null

  const styles = [
    colorPrimario && `--ar-navy: ${colorPrimario};`,
    colorPrimario && `--ar-text: ${colorPrimario};`,
    colorAcento && `--ar-accent: ${colorAcento};`,
  ].filter(Boolean).join(' ')

  return (
    <style dangerouslySetInnerHTML={{ __html: `:root { ${styles} }` }} />
  )
}
