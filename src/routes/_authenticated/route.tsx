import { createFileRoute, redirect } from '@tanstack/react-router'
import { chargerSession } from '@/lib/session'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { ForbiddenError } from '@/features/errors/forbidden'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const session = await chargerSession(context.queryClient)
    if (!session) {
      throw redirect({ to: '/sign-in', search: { redirect: location.href } })
    }
    return { user: session.user, profil: session.profil }
  },
  component: Garde,
})

function Garde() {
  const { profil } = Route.useRouteContext()
  if (!profil) return <ForbiddenError />
  return <AuthenticatedLayout />
}
