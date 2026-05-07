import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTrips, createTrip, updateTrip, deleteTrip, unshareTrip, leaveTrip, type TripInput } from '../lib/trips'
import { useAuthStore } from '../store/auth'

export function useTrips() {
  const sub = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: ['trips', sub],
    queryFn: fetchTrips,
    enabled: !!sub,
  })
}

export function useCreateTrip() {
  const qc = useQueryClient()
  const sub = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: createTrip,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips', sub] }),
  })
}

export function useUpdateTrip() {
  const qc = useQueryClient()
  const sub = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TripInput }) => updateTrip(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips', sub] }),
  })
}

export function useDeleteTrip() {
  const qc = useQueryClient()
  const sub = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: deleteTrip,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips', sub] }),
  })
}

export function useUnshareTrip() {
  const qc = useQueryClient()
  const sub = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: ({ tripId, collaboratorSub }: { tripId: string; collaboratorSub: string }) =>
      unshareTrip(tripId, collaboratorSub),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips', sub] }),
  })
}

export function useLeaveTrip() {
  const qc = useQueryClient()
  const sub = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: leaveTrip,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips', sub] }),
  })
}
