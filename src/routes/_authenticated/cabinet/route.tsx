import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/cabinet')({
  beforeLoad: ({ context }) => {
    if (context.profil?.role !== 'cabinet') throw redirect({ to: '/' })
  },
  component: Outlet,
})
