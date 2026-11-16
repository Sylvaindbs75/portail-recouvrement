import { createFileRoute } from '@tanstack/react-router'
import { FicheDossierSyndic } from '@/features/syndic/fiche-dossier'

export const Route = createFileRoute('/_authenticated/syndic/dossiers/$reference')({
  component: Page,
})

function Page() {
  const { reference } = Route.useParams()
  return <FicheDossierSyndic reference={reference} />
}
