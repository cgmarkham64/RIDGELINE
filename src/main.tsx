import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { router } from './router'
import { keycloak } from './lib/keycloak'
import { useAuthStore } from './store/auth'
import { getMe } from './lib/auth'

const queryClient = new QueryClient()

async function bootstrap() {
  const authenticated = await keycloak.init({
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    pkceMethod: 'S256',
  })

  if (authenticated && keycloak.token && keycloak.tokenParsed) {
    const parsed = keycloak.tokenParsed
    const { setAuth } = useAuthStore.getState()

    // Set token immediately so the axios interceptor works for the getMe call below
    setAuth(keycloak.token, {
      id: parsed.sub!,
      email: (parsed.email as string) ?? '',
      name: ((parsed.name ?? parsed.preferred_username) as string) ?? '',
      avatarUrl: undefined,
    })

    // Fetch full profile to populate avatarUrl
    try {
      const user = await getMe()
      setAuth(keycloak.token, user)
    } catch {
      // avatarUrl stays null; non-fatal
    }
  } else {
    // Clear any stale token from a previous local-JWT session
    useAuthStore.getState().clearAuth()
  }

  // Refresh the token before it expires so the axios interceptor always has a live token
  keycloak.onTokenExpired = async () => {
    try {
      await keycloak.updateToken(30)
      const { user, setAuth } = useAuthStore.getState()
      if (keycloak.token && user) setAuth(keycloak.token, user)
    } catch {
      useAuthStore.getState().clearAuth()
      keycloak.logout()
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  )
}

bootstrap()