import { Scale } from 'lucide-react'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='container grid h-svh max-w-none items-center justify-center'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:p-8'>
        <div className='mb-4 flex flex-col items-center justify-center gap-1 text-center'>
          <div className='flex items-center'>
            <Scale className='me-2 size-6' />
            <h1 className='text-xl font-medium'>[NOM DU CABINET]</h1>
          </div>
          <p className='text-sm text-muted-foreground'>Portail de suivi du recouvrement</p>
        </div>
        {children}
      </div>
    </div>
  )
}
