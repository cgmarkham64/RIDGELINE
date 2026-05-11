import { createRoute, Outlet, redirect } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useAuthStore } from '../store/auth'
import { IconRail } from '../components/layout/IconRail'
import { keycloak, LOCAL_AUTH } from '../lib/keycloak'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  id: '_authenticated',
  beforeLoad: async () => {
    const { token } = useAuthStore.getState()
    if (!token) {
      if (LOCAL_AUTH) {
        throw redirect({ to: '/login' })
      } else {
        await keycloak.login()
        // keycloak.login() triggers a browser redirect and never resolves
      }
    }
  },
  component: () => (
    <div className="flex h-full overflow-hidden">
      <IconRail />
      <Outlet />
    </div>
  ),
})