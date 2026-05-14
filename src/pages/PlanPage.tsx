import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Route } from '../routes/plan'
import { PlanWizard } from '../components/plan/PlanWizard'
import { TripSetupDialog } from '../components/plan/TripSetupDialog'
import { useCreatePlan, useDeletePlan } from '../hooks/usePlans'
import { MoonLoader } from '../components/ui/MoonLoader'

export function PlanPage() {
  const { id, stage } = Route.useSearch()
  const navigate = useNavigate({ from: '/plan' })
  const { mutateAsync: createPlan } = useCreatePlan()
  const { mutateAsync: deletePlan } = useDeletePlan()
  const [createError, setCreateError] = useState(false)
  const [showSetup, setShowSetup] = useState(false)

  async function handleCancelSetup() {
    if (id) {
      try { await deletePlan(id) } catch { /* ignore — trip may not exist */ }
    }
    navigate({ to: '/' })
  }

  // Ref guard prevents StrictMode's double-fire from creating two trips.
  const creating = useRef(false)

  useEffect(() => {
    if (id || creating.current) return
    creating.current = true
    createPlan()
      .then((trip) => {
        navigate({ search: { id: trip._id, stage: undefined }, replace: true })
        setShowSetup(true)
      })
      .catch(() => { creating.current = false; setCreateError(true) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (createError) return (
    <div className="flex h-full items-center justify-center text-[13px] text-text-mid">
      Failed to create trip. Refresh to try again.
    </div>
  )
  if (!id) return <MoonLoader />

  return (
    <>
      <PlanWizard planId={id} initialStage={stage} />
      {showSetup && <TripSetupDialog tripId={id} onClose={() => setShowSetup(false)} onCancel={handleCancelSetup} />}
    </>
  )
}