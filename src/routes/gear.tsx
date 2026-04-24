import { createRoute } from '@tanstack/react-router'
import { Route as authenticatedRoute } from './_authenticated'
import { GearPage } from '../pages/GearPage'

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/gear',
  component: GearPage,
})
