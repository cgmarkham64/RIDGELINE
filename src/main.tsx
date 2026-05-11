import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { router } from './router'
import { keycloak, LOCAL_AUTH } from './lib/keycloak'
import { useAuthStore } from './store/auth'
import { getMe } from './lib/auth'

const queryClient = new QueryClient()

async function bootstrap() {
  if (LOCAL_AUTH) {
    // Validate persisted token against the API; clear if expired
    const { token } = useAuthStore.getState()
    if (token) {
      try {
        const user = await getMe()
        useAuthStore.getState().setAuth(token, user)
      } catch {
        useAuthStore.getState().clearAuth()
      }
    }
  } else {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      pkceMethod: 'S256',
    })

    if (authenticated && keycloak.token && keycloak.tokenParsed) {
      const parsed = keycloak.tokenParsed
      const { setAuth } = useAuthStore.getState()

      setAuth(keycloak.token, {
        id: parsed.sub!,
        email: (parsed.email as string) ?? '',
        name: ((parsed.name ?? parsed.preferred_username) as string) ?? '',
        avatarUrl: undefined,
      })

      try {
        const user = await getMe()
        setAuth(keycloak.token, user)
      } catch {
        // avatarUrl stays null; non-fatal
      }
    } else {
      useAuthStore.getState().clearAuth()
    }

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