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

const field: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
}

const label: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--text-dim)',
}

const input: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-sm)',
  fontSize: 13,
  background: 'var(--surface2)',
  color: 'var(--text)',
  outline: 'none',
  transition: 'border-color 0.14s',
  width: '100%',
}

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
      title: '', location: '', startDate: '', endDate: '',
      description: '', distanceMiles: '', elevationGainFt: '',
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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        width: '100%',
        maxWidth: 520,
        margin: '0 16px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--text-dim)',
          }}>
            {isEdit ? 'Edit trip' : 'New trip'}
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-dim)', fontSize: 18, lineHeight: 1,
          }}>×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={field}>
            <label style={label}>Title *</label>
            <input {...register('title')} placeholder="e.g. Lost Coast Trail" style={input}
              onFocus={e => { e.target.style.borderColor = 'var(--border-mid)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            />
            {errors.title && <span style={{ fontSize: 11, color: 'var(--red)' }}>{errors.title.message}</span>}
          </div>

          <div style={field}>
            <label style={label}>Location *</label>
            <input {...register('location')} placeholder="e.g. Kings Range, CA" style={input}
              onFocus={e => { e.target.style.borderColor = 'var(--border-mid)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            />
            {errors.location && <span style={{ fontSize: 11, color: 'var(--red)' }}>{errors.location.message}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={field}>
              <label style={label}>Start date *</label>
              <input type="date" {...register('startDate')} style={input}
                onFocus={e => { e.target.style.borderColor = 'var(--border-mid)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
              />
              {errors.startDate && <span style={{ fontSize: 11, color: 'var(--red)' }}>{errors.startDate.message}</span>}
            </div>
            <div style={field}>
              <label style={label}>End date *</label>
              <input type="date" {...register('endDate')} style={input}
                onFocus={e => { e.target.style.borderColor = 'var(--border-mid)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
              />
              {errors.endDate && <span style={{ fontSize: 11, color: 'var(--red)' }}>{errors.endDate.message}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={field}>
              <label style={label}>Distance (mi)</label>
              <input type="number" step="0.1" min="0" {...register('distanceMiles')} placeholder="25.4" style={input}
                onFocus={e => { e.target.style.borderColor = 'var(--border-mid)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
              />
            </div>
            <div style={field}>
              <label style={label}>Elevation gain (ft)</label>
              <input type="number" step="1" min="0" {...register('elevationGainFt')} placeholder="4200" style={input}
                onFocus={e => { e.target.style.borderColor = 'var(--border-mid)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
              />
            </div>
          </div>

          <div style={field}>
            <label style={label}>Description</label>
            <textarea {...register('description')} rows={3} placeholder="A brief overview of the trip…" style={{
              ...input,
              resize: 'none',
              lineHeight: 1.6,
            }}
              onFocus={e => { e.target.style.borderColor = 'var(--border-mid)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            />
          </div>

          {(create.error || update.error) && (
            <p style={{ fontSize: 12, color: 'var(--red)' }}>
              Something went wrong — is the server running?
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
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