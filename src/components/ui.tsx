import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { statusLabel, statusStyle, urgencyStyle } from '../lib/format'
import type { IncidentStatus } from '../types'

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-5 w-5 animate-spin rounded-full border-2 border-surface-600 border-t-brand-500 ${className}`}
    />
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
      <p className="font-medium text-slate-300">{title}</p>
      {hint && <p className="text-sm text-slate-500">{hint}</p>}
    </div>
  )
}

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return <span className={`badge ${statusStyle[status]}`}>{statusLabel[status]}</span>
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  return (
    <span className={`badge ${urgencyStyle(urgency)}`}>{urgency === 'high' ? 'High' : 'Low'}</span>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`card mt-10 w-full ${wide ? 'max-w-2xl' : 'max-w-md'} p-5`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button className="btn-ghost -mr-2 px-2" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
