import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPlans, fetchPlan, createPlan, updatePlan, deletePlan } from '../lib/plans'
import type { PlanMeta, PlanData } from '../components/plan/types'

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
    mutationFn: (meta?: Partial<PlanMeta>) => createPlan(meta),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  })
}

export function useUpdatePlan() {
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { meta?: Partial<PlanMeta>; stages?: PlanData } }) =>
      updatePlan(id, body),
  })
}

export function useDeletePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deletePlan,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  })
}