import { createFileRoute } from '@tanstack/react-router'
import { FicheDossierCabinet } from '@/features/cabinet/fiche-dossier'

export const Route = createFileRoute('/_authenticated/cabinet/dossiers/$reference')({
  component: Page,
})

function Page() {
  const { reference } = Route.useParams()
  return <FicheDossierCabinet reference={reference} />
}
