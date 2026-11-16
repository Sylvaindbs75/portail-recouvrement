import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/')({
  beforeLoad: ({ context }) => {
    if (context.profil?.role === 'cabinet') throw redirect({ to: '/cabinet' })
    if (context.profil?.role === 'syndic') throw redirect({ to: '/syndic' })
  },
})
