import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

/** Compte connecté mais sans profil (rôle non attribué par le cabinet). */
export function ForbiddenError() {
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2 px-4'>
        <h1 className='text-[5rem] leading-tight font-bold'>Accès refusé</h1>
        <span className='font-medium'>Votre compte n’est rattaché à aucun espace.</span>
        <p className='text-center text-muted-foreground'>
          Contactez le cabinet pour qu’il active votre accès.
        </p>
        <div className='mt-6'>
          <Button variant='outline' onClick={() => supabase.auth.signOut()}>
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  )
}
