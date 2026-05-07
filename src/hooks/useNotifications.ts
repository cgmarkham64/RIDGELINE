import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNotifications, acceptInvite, declineInvite, markAllRead, dismissNotification } from '../lib/notifications'
import { useAuthStore } from '../store/auth'

export function useNotifications() {
  const sub = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: ['notifications', sub],
    queryFn: fetchNotifications,
    enabled: !!sub,
    refetchInterval: 30_000,
  })
}

export function useAcceptInvite() {
  const qc = useQueryClient()
  const sub = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', sub] })
      qc.invalidateQueries({ queryKey: ['trips', sub] })
    },
  })
}

export function useDeclineInvite() {
  const qc = useQueryClient()
  const sub = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: declineInvite,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', sub] }),
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  const sub = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', sub] }),
  })
}

export function useDismissNotification() {
  const qc = useQueryClient()
  const sub = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: dismissNotification,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', sub] }),
  })
}