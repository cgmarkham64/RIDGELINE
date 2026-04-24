import { createRoute } from '@tanstack/react-router'
import { Route as authenticatedRoute } from './_authenticated'
import { PhotosPage } from '../pages/PhotosPage'

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/photos',
  component: PhotosPage,
})
