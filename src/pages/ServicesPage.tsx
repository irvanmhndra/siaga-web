import { useState } from 'react'
import { Copy, Pencil, Plus, Trash2, Boxes } from 'lucide-react'
import { usePolicies, useServiceMutations, useServices } from '../lib/queries'
import { EmptyState, Modal, PageHeader, Spinner } from '../components/ui'
import { API_BASE_URL, apiError } from '../config/api'
import type { Service } from '../types'

const empty = {
  name: '',
  description: '',
  escalation_policy_id: '',
  status: 'active',
  auto_resolve_minutes: '',
  ack_timeout_minutes: '',
  slack_webhook_url: '',
}

export default function ServicesPage() {
  const { data: services, isLoading } = useServices()
  const { data: policies } = usePolicies()
  const { create, update, remove } = useServiceMutations()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState({ ...empty })
  const [error, setError] = useState('')

  const openCreate = () => {
    setEditing(null)
    setForm({ ...empty })
    setError('')
    setOpen(true)
  }

  const openEdit = (s: Service) => {
    setEditing(s)
    setForm({
      name: s.name,
      description: s.description ?? '',
      escalation_policy_id: s.escalation_policy_id ?? '',
      status: s.status,
      auto_resolve_minutes: s.auto_resolve_minutes ? String(s.auto_resolve_minutes) : '',
      ack_timeout_minutes: s.ack_timeout_minutes ? String(s.ack_timeout_minutes) : '',
      slack_webhook_url: s.slack_webhook_url ?? '',
    })
    setError('')
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const body = {
      name: form.name,
      description: form.description || null,
      escalation_policy_id: form.escalation_policy_id || null,
      status: form.status,
      auto_resolve_minutes: form.auto_resolve_minutes ? Number(form.auto_resolve_minutes) : null,
      ack_timeout_minutes: form.ack_timeout_minutes ? Number(form.ack_timeout_minutes) : null,
      slack_webhook_url: form.slack_webhook_url || null,
    }
    try {
      if (editing) await update.mutateAsync({ id: editing.id, body })
      else await create.mutateAsync(body)
      setOpen(false)
    } catch (err) {
      setError(apiError(err))
    }
  }

  const policyName = (id?: string) => policies?.find((p) => p.id === id)?.name ?? 'No policy'
  const saving = create.isPending || update.isPending

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle="Monitored systems. Each service has an integration key for the Events API."
        action={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> New service
          </button>
        }
      />

      {isLoading ? (
        <div className="card flex justify-center py-12">
          <Spinner />
        </div>
      ) : (services ?? []).length === 0 ? (
        <EmptyState title="No services yet" hint="Create your first service to start receiving events." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {services?.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              policyName={policyName(s.escalation_policy_id)}
              onEdit={() => openEdit(s)}
              onDelete={() => remove.mutate(s.id)}
            />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit service' : 'New service'}>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Escalation policy</label>
            <select
              className="input"
              value={form.escalation_policy_id}
              onChange={(e) => setForm({ ...form, escalation_policy_id: e.target.value })}
            >
              <option value="">— no policy —</option>
              {policies?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <div>
              <label className="label">Auto-resolve (min)</label>
              <input
                type="number"
                className="input"
                placeholder="optional"
                value={form.auto_resolve_minutes}
                onChange={(e) => setForm({ ...form, auto_resolve_minutes: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Ack timeout (min)</label>
            <input
              type="number"
              className="input"
              placeholder="optional — re-escalate if acked but not resolved in time"
              value={form.ack_timeout_minutes}
              onChange={(e) => setForm({ ...form, ack_timeout_minutes: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Slack webhook URL</label>
            <input
              className="input"
              placeholder="optional"
              value={form.slack_webhook_url}
              onChange={(e) => setForm({ ...form, slack_webhook_url: e.target.value })}
            />
          </div>
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Spinner /> : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function ServiceCard({
  service,
  policyName,
  onEdit,
  onDelete,
}: {
  service: Service
  policyName: string
  onEdit: () => void
  onDelete: () => void
}) {
  const [copied, setCopied] = useState<'key' | 'curl' | null>(null)
  const curl = `curl -X POST ${API_BASE_URL}/events/enqueue \\
  -H 'Content-Type: application/json' \\
  -d '{"routing_key":"${service.integration_key}","event_action":"trigger","payload":{"summary":"Example alert","severity":"critical"}}'`

  const copy = (text: string, which: 'key' | 'curl') => {
    navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600/15 text-brand-400">
            <Boxes size={18} />
          </div>
          <div>
            <p className="font-semibold text-white">{service.name}</p>
            <p className="text-xs text-slate-500">{policyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`badge ${
              service.status === 'active'
                ? 'bg-emerald-500/15 text-emerald-400'
                : service.status === 'maintenance'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-slate-500/15 text-slate-400'
            }`}
          >
            {service.status}
          </span>
          <button className="btn-ghost px-1.5 text-slate-500 hover:text-slate-200" onClick={onEdit}>
            <Pencil size={15} />
          </button>
          <button className="btn-ghost px-1.5 text-slate-500 hover:text-red-400" onClick={onDelete}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <label className="label !mb-1 text-xs">Integration key</label>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-md bg-surface-850 px-2 py-1.5 font-mono text-xs text-slate-300">
            {service.integration_key}
          </code>
          <button className="btn-outline px-2 py-1.5 text-xs" onClick={() => copy(service.integration_key, 'key')}>
            <Copy size={13} /> {copied === 'key' ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-medium text-brand-400 hover:text-brand-300">
          How to send an event (curl)
        </summary>
        <div className="mt-2 flex items-start gap-2">
          <pre className="flex-1 overflow-x-auto rounded-md bg-surface-950 p-2 font-mono text-[11px] leading-relaxed text-slate-400">
            {curl}
          </pre>
          <button className="btn-outline shrink-0 px-2 py-1.5 text-xs" onClick={() => copy(curl, 'curl')}>
            <Copy size={13} /> {copied === 'curl' ? 'OK' : 'Copy'}
          </button>
        </div>
      </details>
    </div>
  )
}
