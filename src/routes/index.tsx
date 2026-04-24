import { createRoute } from '@tanstack/react-router'
import { Route as authenticatedRoute } from './_authenticated'
import { HomePage } from '../pages/HomePage'

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/',
  component: HomePage,
})
