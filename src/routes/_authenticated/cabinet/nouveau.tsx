import { createFileRoute } from '@tanstack/react-router'
import { NouveauDossier } from '@/features/cabinet/nouveau-dossier'

export const Route = createFileRoute('/_authenticated/cabinet/nouveau')({
  component: NouveauDossier,
})
