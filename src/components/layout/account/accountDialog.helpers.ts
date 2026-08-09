export function apiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { error?: string } } }).response
    if (res?.data?.error) return res.data.error
  }
  return fallback
}
