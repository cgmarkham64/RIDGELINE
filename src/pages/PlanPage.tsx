import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Route } from '../routes/plan'
import { PlanWizard } from '../components/plan/PlanWizard'
import { useCreatePlan } from '../hooks/usePlans'
import { MoonLoader } from '../components/ui/MoonLoader'

export function PlanPage() {
  const { id } = Route.useSearch()
  const navigate = useNavigate({ from: '/plan' })
  const { mutateAsync: createPlan, isPending } = useCreatePlan()

  useEffect(() => {
    if (!id) {
      createPlan(undefined).then(plan => {
        navigate({ search: { id: plan._id }, replace: true })
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!id || isPending) return <MoonLoader />
  return <PlanWizard planId={id} />
}