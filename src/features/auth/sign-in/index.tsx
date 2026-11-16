import { useSearch } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <Card className='max-w-sm gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>Connexion</CardTitle>
          <CardDescription>
            Saisissez l’adresse e-mail et le mot de passe fournis par le cabinet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
        <CardFooter>
          <p className='text-center text-xs text-muted-foreground'>
            Version de démonstration : données entièrement fictives.
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
