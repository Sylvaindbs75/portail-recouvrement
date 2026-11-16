import { createFileRoute } from '@tanstack/react-router'
import { Portefeuille } from '@/features/cabinet/portefeuille'

export const Route = createFileRoute('/_authenticated/cabinet/')({
  component: Portefeuille,
})
