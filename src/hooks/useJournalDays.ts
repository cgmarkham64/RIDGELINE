import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchJournalDays,
  createJournalDay,
  updateJournalDay,
  type JournalDayInput,
} from '../lib/journalDays'
import { useAuthStore } from '../store/auth'

export function useJournalDays(tripId: string) {
  const sub = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: ['journal-days', sub, tripId],
    queryFn: () => fetchJournalDays(tripId),
    enabled: !!sub,
  })
}

export function useSaveJournalDay(tripId: string) {
  const qc = useQueryClient()
  const sub = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: JournalDayInput }) =>
      id ? updateJournalDay(id, input) : createJournalDay(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal-days', sub, tripId] }),
  })
}
