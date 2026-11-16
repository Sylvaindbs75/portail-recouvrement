import { useNavigate, useRouter } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type GeneralErrorProps = React.HTMLAttributes<HTMLDivElement> & {
  minimal?: boolean
}

export function GeneralError({ className, minimal = false }: GeneralErrorProps) {
  const navigate = useNavigate()
  const { history } = useRouter()
  return (
    <div className={cn('h-svh w-full', className)}>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2 px-4'>
        {!minimal && <h1 className='text-[5rem] leading-tight font-bold'>Erreur</h1>}
        <span className='font-medium'>Une erreur inattendue s’est produite.</span>
        <p className='text-center text-muted-foreground'>Veuillez réessayer dans un instant.</p>
        {!minimal && (
          <div className='mt-6 flex gap-4'>
            <Button variant='outline' onClick={() => history.go(-1)}>
              Retour
            </Button>
            <Button onClick={() => navigate({ to: '/' })}>Accueil</Button>
          </div>
        )}
      </div>
    </div>
  )
}
