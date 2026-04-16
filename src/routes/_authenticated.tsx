import { createRoute, redirect, Outlet } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useAuthStore } from '../store/auth'
import { IconRail } from '../components/layout/IconRail'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  id: '_authenticated',
  beforeLoad: () => {
    const { token } = useAuthStore.getState()
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <IconRail />
      <Outlet />
    </div>
  ),
})