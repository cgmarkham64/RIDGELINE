import { Trip } from '../models/Trip'
import { UserProfile } from '../models/UserProfile'
import { HttpError } from '../utils/routeHelpers'

export type SharedEntry = { sub: string; role: string }

export interface TripLean extends Record<string, unknown> {
  ownerSub: string
  sharedWith: Array<SharedEntry | string>
}

export function normalizeShared(sw: Array<SharedEntry | string>): SharedEntry[] {
  return (sw ?? []).map((e) => (typeof e === 'string' ? { sub: e, role: 'edit' } : e))
}

export function partySizeFor(trip: { sharedWith: Array<SharedEntry | string> }): number {
  return normalizeShared(trip.sharedWith).length + 1
}

export function canRead(
  trip: { ownerSub: string; sharedWith: Array<SharedEntry | string> },
  sub: string,
): boolean {
  return trip.ownerSub === sub || normalizeShared(trip.sharedWith).some((e) => e.sub === sub)
}

export async function populateTripUsers(trip: TripLean) {
  const entries = normalizeShared(trip.sharedWith)
  const toFetch = [...new Set([...entries.map((e) => e.sub), trip.ownerSub].filter(Boolean))]
  const users = toFetch.length
    ? await UserProfile.find({ sub: { $in: toFetch } })
        .select('sub name')
        .lean<{ sub: string; name: string }[]>()
    : []
  const owner = users.find((u) => u.sub === trip.ownerSub)
  return {
    ...trip,
    ownerName: owner?.name ?? 'Unknown',
    sharedWith: entries.map((entry) => {
      const u = users.find((u) => u.sub === entry.sub)
      return { sub: entry.sub, name: u?.name ?? 'Unknown', role: entry.role }
    }),
  }
}

export async function fetchTripForRead(tripId: string, sub: string, populate?: string): Promise<TripLean> {
  const query = Trip.findById(tripId)
  if (populate) query.populate(populate)
  const trip = (await query.lean()) as TripLean | null
  if (!trip) throw new HttpError(404, 'Trip not found')
  if (!canRead(trip, sub)) throw new HttpError(403, 'Forbidden')
  return trip
}

export async function fetchTripForWrite(tripId: string, sub: string): Promise<TripLean> {
  const trip = (await Trip.findById(tripId).lean()) as TripLean | null
  if (!trip) throw new HttpError(404, 'Trip not found')
  if (trip.ownerSub !== sub) throw new HttpError(403, 'Forbidden')
  return trip
}