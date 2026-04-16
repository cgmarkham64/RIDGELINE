import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchJournalDays,
  createJournalDay,
  updateJournalDay,
  type JournalDayInput,
} from '../lib/journalDays'

export function useJournalDays(tripId: string) {
  return useQuery({
    queryKey: ['journal-days', tripId],
    queryFn: () => fetchJournalDays(tripId),
  })
}

export function useSaveJournalDay(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: JournalDayInput }) =>
      id ? updateJournalDay(id, input) : createJournalDay(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal-days', tripId] }),
  })
}