export const FORWARD: Partial<Record<string, { label: string; next: string }>> = {
  planning:   { label: 'Mark ready',  next: 'ready' },
  ready:      { label: 'Start trip',  next: 'on-trail' },
  'on-trail': { label: 'Finish trip', next: 'wrap-up' },
  'wrap-up':  { label: 'Complete',    next: 'complete' },
}

export function getStatusTransition(tripStatus: string | undefined, isOwner: boolean | undefined) {
  const forward = tripStatus ? FORWARD[tripStatus] : undefined
  const canGoBack = !!isOwner && !!tripStatus && tripStatus !== 'planning'
  return { forward, canGoBack }
}
