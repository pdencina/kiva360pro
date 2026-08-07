import PostularWrapper from '@/components/admision/PostularWrapper'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Postulación — Kiva360',
  description: 'Formulario de postulación. Completa tus datos y adjunta los documentos requeridos.',
}

interface Props {
  searchParams: { c?: string }
}

export default function PostularPage({ searchParams }: Props) {
  const colegioId = searchParams.c || ''
  return <PostularWrapper colegioId={colegioId} />
}
