import { createRoute } from '@tanstack/react-router'
import { Route as authenticatedRoute } from './_authenticated'
import { PlanPage } from '../pages/PlanPage'

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/plan',
  component: PlanPage,
})