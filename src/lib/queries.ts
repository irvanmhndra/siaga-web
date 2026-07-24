import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../config/api'
import { useAuthStore } from '../store/authStore'
import type {
  EscalationPolicy,
  Incident,
  IncidentStatus,
  NotificationList,
  Schedule,
  Service,
  Team,
  User,
} from '../types'

async function get<T>(url: string): Promise<T> {
  const res = await api.get(url)
  return res.data.data as T
}

// ---- Users / profile ----
export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: () => get<User[]>('/users') })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: async (body: Partial<User>) => {
      const res = await api.put('/profile', body)
      return res.data.data as User
    },
    onSuccess: (user) => {
      setUser(user)
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useInviteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; email: string; password: string }) =>
      api.post('/users', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

// ---- Teams ----
export function useTeams() {
  return useQuery({ queryKey: ['teams'], queryFn: () => get<Team[]>('/teams') })
}
export function useTeamMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['teams'] })
  return {
    create: useMutation({
      mutationFn: (body: { name: string }) => api.post('/teams', body),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete(`/teams/${id}`),
      onSuccess: invalidate,
    }),
    addMember: useMutation({
      mutationFn: (v: { teamId: string; userId: string }) =>
        api.post(`/teams/${v.teamId}/members`, { user_id: v.userId }),
      onSuccess: invalidate,
    }),
    removeMember: useMutation({
      mutationFn: (v: { teamId: string; userId: string }) =>
        api.delete(`/teams/${v.teamId}/members/${v.userId}`),
      onSuccess: invalidate,
    }),
  }
}

// ---- Schedules ----
export function useSchedules() {
  return useQuery({ queryKey: ['schedules'], queryFn: () => get<Schedule[]>('/schedules') })
}
export function useSchedule(id: string | undefined) {
  return useQuery({
    queryKey: ['schedules', id],
    queryFn: () => get<Schedule>(`/schedules/${id}`),
    enabled: !!id,
  })
}
export function useScheduleMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['schedules'] })
  return {
    create: useMutation({
      mutationFn: (body: unknown) => api.post('/schedules', body),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (v: { id: string; body: unknown }) => api.put(`/schedules/${v.id}`, v.body),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete(`/schedules/${id}`),
      onSuccess: invalidate,
    }),
    // invalidate ['schedules'] also refreshes ['schedules', id] (prefix match).
    addOverride: useMutation({
      mutationFn: (v: { scheduleId: string; body: { user_id: string; start_at: string; end_at: string } }) =>
        api.post(`/schedules/${v.scheduleId}/overrides`, v.body),
      onSuccess: invalidate,
    }),
    deleteOverride: useMutation({
      mutationFn: (v: { scheduleId: string; overrideId: string }) =>
        api.delete(`/schedules/${v.scheduleId}/overrides/${v.overrideId}`),
      onSuccess: invalidate,
    }),
  }
}

// ---- Escalation policies ----
export function usePolicies() {
  return useQuery({
    queryKey: ['policies'],
    queryFn: () => get<EscalationPolicy[]>('/escalation-policies'),
  })
}
export function usePolicyMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['policies'] })
  return {
    create: useMutation({
      mutationFn: (body: unknown) => api.post('/escalation-policies', body),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (v: { id: string; body: unknown }) =>
        api.put(`/escalation-policies/${v.id}`, v.body),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete(`/escalation-policies/${id}`),
      onSuccess: invalidate,
    }),
  }
}

// ---- Services ----
export function useServices() {
  return useQuery({ queryKey: ['services'], queryFn: () => get<Service[]>('/services') })
}
export function useServiceMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['services'] })
  return {
    create: useMutation({
      mutationFn: (body: unknown) => api.post('/services', body),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (v: { id: string; body: unknown }) => api.put(`/services/${v.id}`, v.body),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete(`/services/${id}`),
      onSuccess: invalidate,
    }),
  }
}

// ---- Incidents ----
export function useIncidents(filter: { status?: IncidentStatus; service_id?: string }) {
  const params = new URLSearchParams()
  if (filter.status) params.set('status', filter.status)
  if (filter.service_id) params.set('service_id', filter.service_id)
  const qs = params.toString()
  return useQuery({
    queryKey: ['incidents', filter],
    queryFn: () => get<Incident[]>(`/incidents${qs ? `?${qs}` : ''}`),
    refetchInterval: 10000,
  })
}
export function useIncident(id: string | undefined) {
  return useQuery({
    queryKey: ['incidents', id],
    queryFn: () => get<Incident>(`/incidents/${id}`),
    enabled: !!id,
    refetchInterval: 8000,
  })
}
export function useIncidentActions() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['incidents'] })
  return {
    acknowledge: useMutation({
      mutationFn: (id: string) => api.post(`/incidents/${id}/acknowledge`),
      onSuccess: invalidate,
    }),
    resolve: useMutation({
      mutationFn: (id: string) => api.post(`/incidents/${id}/resolve`),
      onSuccess: invalidate,
    }),
  }
}

// ---- Notifications ----
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => get<NotificationList>('/notifications'),
    refetchInterval: 15000,
  })
}
export function useNotificationActions() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['notifications'] })
  return {
    markAllRead: useMutation({
      mutationFn: () => api.post('/notifications/read-all'),
      onSuccess: invalidate,
    }),
    markRead: useMutation({
      mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
      onSuccess: invalidate,
    }),
  }
}
