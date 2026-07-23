import type { IncidentStatus } from '../types'

export function timeAgo(iso?: string): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const statusStyle: Record<IncidentStatus, string> = {
  triggered: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  acknowledged: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
}

export const statusLabel: Record<IncidentStatus, string> = {
  triggered: 'Triggered',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
}

export function urgencyStyle(urgency: string): string {
  return urgency === 'high'
    ? 'bg-red-500/10 text-red-300 ring-1 ring-red-500/20'
    : 'bg-slate-500/10 text-slate-300 ring-1 ring-slate-500/20'
}
