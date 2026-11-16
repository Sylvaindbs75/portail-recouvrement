import { z } from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { chargerSession, cheminInterne } from '@/lib/session'
import { SignIn } from '@/features/auth/sign-in'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/sign-in')({
  validateSearch: searchSchema,
  beforeLoad: async ({ context, search }) => {
    const session = await chargerSession(context.queryClient)
    if (session?.profil) throw redirect({ href: cheminInterne(search.redirect) })
  },
  component: SignIn,
})
