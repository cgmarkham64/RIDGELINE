import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPlans, fetchPlan, createPlan, updatePlan, deletePlan } from '../lib/plans'
import type { Trip } from '../types'

export function usePlans() {
  return useQuery({ queryKey: ['plans'], queryFn: fetchPlans })
}

export function usePlan(id: string | undefined) {
  return useQuery({
    queryKey: ['plan', id],
    queryFn: () => fetchPlan(id!),
    enabled: !!id,
  })
}

export function useCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => createPlan(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  })
}

export function useUpdatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: {
        title?: string
        location?: string
        startDate?: string
        endDate?: string
        planStages?: object
        status?: string
      }
    }) => updatePlan(id, body),
    onSuccess: (data: Trip) => {
      qc.invalidateQueries({ queryKey: ['plan', data._id] })
      qc.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useDeletePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deletePlan,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  })
}