import type { QueryClient } from '@tanstack/react-query'
import { requetes } from '@/lib/recouvrement/api'
import { supabase } from '@/lib/supabase'

/** Session courante et profil (rôle) de l'utilisateur, ou null si non connecté. */
export async function chargerSession(queryClient: QueryClient) {
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (!user) return null
  const profil = await queryClient.ensureQueryData(requetes.profil(user.id))
  return { user, profil }
}

/** N'accepte qu'un chemin interne (évite les redirections vers un autre site). */
export function cheminInterne(redirect: string | undefined): string {
  if (!redirect) return '/'
  try {
    const url = new URL(redirect, window.location.origin)
    if (url.origin !== window.location.origin) return '/'
    if (url.pathname === '/sign-in') return '/'
    return url.pathname + url.search + url.hash
  } catch {
    return '/'
  }
}
