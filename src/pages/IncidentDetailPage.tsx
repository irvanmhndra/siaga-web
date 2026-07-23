import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  CircleDot,
  Flag,
  GitBranch,
  MessageSquare,
} from 'lucide-react'
import { useIncident, useIncidentActions, useServices, useUsers } from '../lib/queries'
import { Spinner, StatusBadge, UrgencyBadge } from '../components/ui'
import { formatDateTime, timeAgo } from '../lib/format'

const logIcon: Record<string, typeof Flag> = {
  trigger: Flag,
  acknowledge: CheckCircle2,
  resolve: CircleDot,
  escalate: GitBranch,
  notify: Bell,
}

export default function IncidentDetailPage() {
  const { id } = useParams()
  const { data: inc, isLoading } = useIncident(id)
  const { acknowledge, resolve } = useIncidentActions()
  const { data: services } = useServices()
  const { data: users } = useUsers()

  if (isLoading || !inc) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const service = services?.find((s) => s.id === inc.service_id)
  const assignee = users?.find((u) => u.id === inc.assigned_user_id)

  return (
    <div>
      <Link to="/incidents" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft size={16} /> Incidents
      </Link>

      <div className="card mb-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <StatusBadge status={inc.status} />
              <UrgencyBadge urgency={inc.urgency} />
            </div>
            <h1 className="text-xl font-bold text-white">{inc.title}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {service?.name ?? 'Service'} · created {timeAgo(inc.triggered_at)}
            </p>
          </div>
          <div className="flex gap-2">
            {inc.status !== 'resolved' && (
              <>
                {inc.status === 'triggered' && (
                  <button
                    className="btn-outline"
                    onClick={() => acknowledge.mutate(inc.id)}
                    disabled={acknowledge.isPending}
                  >
                    <CheckCircle2 size={16} /> Acknowledge
                  </button>
                )}
                <button
                  className="btn-primary"
                  onClick={() => resolve.mutate(inc.id)}
                  disabled={resolve.isPending}
                >
                  <CircleDot size={16} /> Resolve
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-surface-800 pt-4 text-sm sm:grid-cols-4">
          <Meta label="Assigned" value={assignee?.name ?? '—'} />
          <Meta label="Escalation level" value={String(inc.escalation_level + 1)} />
          <Meta label="Acknowledged" value={inc.acknowledged_at ? formatDateTime(inc.acknowledged_at) : '—'} />
          <Meta label="Dedup key" value={inc.dedup_key} mono />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
            <MessageSquare size={16} /> Timeline
          </h2>
          <div className="card p-5">
            <ol className="relative space-y-5 border-l border-surface-700 pl-6">
              {(inc.log ?? []).map((e) => {
                const Icon = logIcon[e.type] ?? CircleDot
                return (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-surface-800 ring-4 ring-surface-900">
                      <Icon size={13} className="text-brand-400" />
                    </span>
                    <p className="text-sm text-slate-200">{e.message}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(e.created_at)}</p>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-semibold text-white">Event details</h2>
          <div className="card p-4">
            <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-slate-400">
              {JSON.stringify(inc.details ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-0.5 truncate text-slate-200 ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  )
}
