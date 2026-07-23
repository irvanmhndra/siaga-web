import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useIncidents, useServices, useUsers } from '../lib/queries'
import { PageHeader, Spinner, StatusBadge, UrgencyBadge, EmptyState } from '../components/ui'
import { timeAgo } from '../lib/format'
import type { IncidentStatus } from '../types'

const filters: { key: IncidentStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'triggered', label: 'Triggered' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'resolved', label: 'Resolved' },
]

export default function IncidentsPage() {
  const [status, setStatus] = useState<IncidentStatus | 'all'>('all')
  const { data: incidents, isLoading } = useIncidents(
    status === 'all' ? {} : { status },
  )
  const { data: services } = useServices()
  const { data: users } = useUsers()
  const userName = (id?: string) => users?.find((u) => u.id === id)?.name ?? '—'
  const serviceName = (id: string) => services?.find((s) => s.id === id)?.name ?? 'Service'

  return (
    <div>
      <PageHeader title="Incidents" subtitle="Every incident across your organization" />

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-surface-850 p-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              status === f.key ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card flex justify-center py-12">
          <Spinner />
        </div>
      ) : (incidents ?? []).length === 0 ? (
        <EmptyState title="No incidents" hint="Send an event to a service to open an incident." />
      ) : (
        <div className="card divide-y divide-surface-800">
          {incidents?.map((i) => (
            <Link
              key={i.id}
              to={`/incidents/${i.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-surface-850"
            >
              <div
                className={`h-2 w-2 shrink-0 rounded-full ${
                  i.status === 'triggered'
                    ? 'bg-red-500'
                    : i.status === 'acknowledged'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-100">{i.title}</p>
                <p className="text-xs text-slate-500">
                  {serviceName(i.service_id)} · {timeAgo(i.triggered_at)} · {userName(i.assigned_user_id)}
                </p>
              </div>
              <UrgencyBadge urgency={i.urgency} />
              <StatusBadge status={i.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
