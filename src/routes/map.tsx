import { createRoute } from '@tanstack/react-router'
import { Route as authenticatedRoute } from './_authenticated'
import { MapPage } from '../pages/MapPage'

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/map',
  component: MapPage,
})
