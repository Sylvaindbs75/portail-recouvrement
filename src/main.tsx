import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
// Generated Routes
import { routeTree } from './routeTree.gen'
// Styles
import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: import.meta.env.PROD ? 2 : false,
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000,
    },
  },
})

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Session expirée ou déconnexion : on vide le cache et on revient à la connexion
// en conservant la page demandée (PRD §9).
supabase.auth.onAuthStateChange((evenement) => {
  if (evenement === 'SIGNED_OUT') {
    queryClient.clear()
    const location = router.state.location
    if (location.pathname !== '/sign-in') {
      router.navigate({
        to: '/sign-in',
        search: { redirect: location.href },
        replace: true,
      })
    }
  }
})

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
            <DirectionProvider>
              <RouterProvider router={router} />
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
