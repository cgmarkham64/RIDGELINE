import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Trip } from '../../types'
import { useCreateTrip, useUpdateTrip } from '../../hooks/useTrips'
import type { TripInput } from '../../lib/trips'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  description: z.string().optional(),
  distanceMiles: z.string().optional(),
  elevationGainFt: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  trip?: Trip
  onClose: () => void
  onSaved: (trip: Trip) => void
}

function toDateInput(iso: string) {
  return iso.slice(0, 10)
}

// Shared input className — matches the original `input` style object
const inputCls =
  'w-full px-2.5 py-2 border border-border focus:border-border-mid rounded-sm text-[13px] bg-surface-2 text-text outline-none transition-[border-color] duration-[140ms]'

export function TripModal({ trip, onClose, onSaved }: Props) {
  const isEdit = !!trip
  const create = useCreateTrip()
  const update = useUpdateTrip()
  const isPending = create.isPending || update.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
      distanceMiles: '',
      elevationGainFt: '',
    },
  })

  useEffect(() => {
    if (trip) {
      reset({
        title: trip.title,
        location: trip.location,
        startDate: toDateInput(trip.startDate),
        endDate: toDateInput(trip.endDate),
        description: trip.description ?? '',
        distanceMiles: trip.distanceMiles?.toString() ?? '',
        elevationGainFt: trip.elevationGainFt?.toString() ?? '',
      })
    }
  }, [trip, reset])

  async function onSubmit(data: FormValues) {
    const tripInput: TripInput = {
      title: data.title,
      location: data.location,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description || undefined,
      distanceMiles: data.distanceMiles ? parseFloat(data.distanceMiles) : undefined,
      elevationGainFt: data.elevationGainFt ? parseFloat(data.elevationGainFt) : undefined,
    }
    const saved = isEdit
      ? await update.mutateAsync({ id: trip._id, input: tripInput })
      : await create.mutateAsync(tripInput)
    onSaved(saved)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="bg-surface border border-border rounded-lg w-full max-w-[520px] mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="font-mono text-[11px] font-bold tracking-[0.16em] uppercase text-text-dim">
            {isEdit ? 'Edit trip' : 'New trip'}
          </span>
          <button
            onClick={onClose}
            className="bg-transparent border-0 cursor-pointer text-text-dim text-[18px] leading-none"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-5 flex flex-col gap-[14px]"
        >
          <div className="flex flex-col gap-[5px]">
            <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim">Title *</label>
            <input
              {...register('title')}
              placeholder="e.g. Lost Coast Trail"
              className={inputCls}
            />
            {errors.title && (
              <span className="text-[11px] text-red">{errors.title.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim">Location *</label>
            <input
              {...register('location')}
              placeholder="e.g. Kings Range, CA"
              className={inputCls}
            />
            {errors.location && (
              <span className="text-[11px] text-red">{errors.location.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-[5px]">
              <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim">Start date *</label>
              <input
                type="date"
                {...register('startDate')}
                className={inputCls}
                onFocus={(e) => { e.target.style.borderColor = 'var(--border-mid)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
              />
              {errors.startDate && (
                <span className="text-[11px] text-red">{errors.startDate.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-[5px]">
              <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim">End date *</label>
              <input
                type="date"
                {...register('endDate')}
                className={inputCls}
                onFocus={(e) => { e.target.style.borderColor = 'var(--border-mid)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
              />
              {errors.endDate && (
                <span className="text-[11px] text-red">{errors.endDate.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-[5px]">
              <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim">Distance (mi)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                {...register('distanceMiles')}
                placeholder="25.4"
                className={inputCls}
                onFocus={(e) => { e.target.style.borderColor = 'var(--border-mid)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
              />
            </div>
            <div className="flex flex-col gap-[5px]">
              <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim">Elevation gain (ft)</label>
              <input
                type="number"
                step="1"
                min="0"
                {...register('elevationGainFt')}
                placeholder="4200"
                className={inputCls}
                onFocus={(e) => { e.target.style.borderColor = 'var(--border-mid)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="A brief overview of the trip…"
              className={`${inputCls} resize-none leading-[1.6]`}
            />
          </div>

          {(create.error || update.error) && (
            <p className="text-[12px] text-red">
              Something went wrong — is the server running?
            </p>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} disabled={isPending} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="btn btn-primary">
              {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}