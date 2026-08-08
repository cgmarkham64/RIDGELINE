import type { PartnerEntry, PartnersCardTrip } from './partnersCard.types'

export function confirmedPartners(trip: PartnersCardTrip): { sub: string; name: string }[] {
  return [
    ...(trip?.ownerSub ? [{ sub: trip.ownerSub, name: trip.ownerName ?? 'Owner' }] : []),
    ...(trip?.sharedWith?.map((c) => ({ sub: c.sub, name: c.name })) ?? []),
  ]
}

export function combinePartners(
  partners: { sub: string; name: string }[],
  pendingInvites: { sub: string; name: string }[],
): PartnerEntry[] {
  return [
    ...partners.map((p) => ({ ...p, pending: false })),
    ...pendingInvites.map((p) => ({ ...p, pending: true })),
  ]
}
