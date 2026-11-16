import { createFileRoute } from '@tanstack/react-router'
import { TableauDeBordSyndic } from '@/features/syndic/tableau-de-bord'

export const Route = createFileRoute('/_authenticated/syndic/')({
  component: TableauDeBordSyndic,
})
