import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Boxes, CalendarClock } from 'lucide-react'
import { useIncidents, useSchedules, useServices, useUsers } from '../lib/queries'
import { StatusBadge, UrgencyBadge, Spinner, PageHeader } from '../components/ui'
import { timeAgo } from '../lib/format'
import { resolveOnCall } from '../lib/oncall'

export default function DashboardPage() {
  const { data: incidents, isLoading } = useIncidents({})
  const { data: services } = useServices()
  const { data: schedules } = useSchedules()
  const { data: users } = useUsers()

  const open = (incidents ?? []).filter((i) => i.status !== 'resolved')
  const triggered = open.filter((i) => i.status === 'triggered')
  const acked = open.filter((i) => i.status === 'acknowledged')
  const userName = (id?: string) => users?.find((u) => u.id === id)?.name ?? '—'

  const stats = [
    { label: 'Triggered', value: triggered.length, icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Acknowledged', value: acked.length, icon: CheckCircle2, color: 'text-amber-400' },
    { label: 'Services', value: services?.length ?? 0, icon: Boxes, color: 'text-brand-400' },
    { label: 'Schedules', value: schedules?.length ?? 0, icon: CalendarClock, color: 'text-sky-400' },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="On-call and incident status across your organization" />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{s.label}</span>
              <s.icon size={18} className={s.color} />
            </div>
            <p className="mt-2 text-3xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-white">Active incidents</h2>
            <Link to="/incidents" className="text-sm text-brand-400 hover:text-brand-300">
              View all
            </Link>
          </div>
          {isLoading ? (
            <div className="card flex justify-center py-10">
              <Spinner />
            </div>
          ) : open.length === 0 ? (
            <div className="card px-6 py-10 text-center text-slate-400">
              🎉 No active incidents. All quiet.
            </div>
          ) : (
            <div className="card divide-y divide-surface-800">
              {open.map((i) => (
                <Link
                  key={i.id}
                  to={`/incidents/${i.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-850"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-100">{i.title}</p>
                    <p className="text-xs text-slate-500">
                      {services?.find((s) => s.id === i.service_id)?.name ?? 'Service'} ·{' '}
                      {timeAgo(i.triggered_at)} · assigned {userName(i.assigned_user_id)}
                    </p>
                  </div>
                  <UrgencyBadge urgency={i.urgency} />
                  <StatusBadge status={i.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-semibold text-white">On-call now</h2>
          {(schedules ?? []).length === 0 ? (
            <div className="card px-4 py-8 text-center text-sm text-slate-500">
              No on-call schedules yet
            </div>
          ) : (
            <div className="card divide-y divide-surface-800">
              {schedules?.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.timezone}</p>
                  </div>
                  <span className="badge bg-brand-600/15 text-brand-300">
                    {userName(resolveOnCall(s) ?? undefined)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
