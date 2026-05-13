import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Route } from '../routes/plan'
import { PlanWizard } from '../components/plan/PlanWizard'
import { useCreatePlan } from '../hooks/usePlans'
import { MoonLoader } from '../components/ui/MoonLoader'

export function PlanPage() {
  const { id } = Route.useSearch()
  const navigate = useNavigate({ from: '/plan' })
  const { mutateAsync: createPlan } = useCreatePlan()
  const [createError, setCreateError] = useState(false)

  // Ref guard prevents StrictMode's double-fire from creating two plans.
  // Refs persist across the mount→cleanup→remount cycle in dev, so the
  // second invocation sees creating.current === true and bails out.
  const creating = useRef(false)

  useEffect(() => {
    if (id || creating.current) return
    creating.current = true
    createPlan(undefined)
      .then(plan => navigate({ search: { id: plan._id }, replace: true }))
      .catch(() => { creating.current = false; setCreateError(true) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (createError) return (
    <div className="flex h-full items-center justify-center text-[13px] text-text-mid">
      Failed to create plan. Refresh to try again.
    </div>
  )
  if (!id) return <MoonLoader />
  return <PlanWizard planId={id} />
}