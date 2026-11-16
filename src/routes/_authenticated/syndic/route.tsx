import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/syndic')({
  beforeLoad: ({ context }) => {
    if (context.profil?.role !== 'syndic') throw redirect({ to: '/' })
  },
  component: Outlet,
})
