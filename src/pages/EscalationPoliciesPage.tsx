import { useState } from 'react'
import { GitBranch, Pencil, Plus, Trash2, Users, CalendarClock } from 'lucide-react'
import {
  usePolicies,
  usePolicyMutations,
  useSchedules,
  useUsers,
} from '../lib/queries'
import { EmptyState, Modal, PageHeader, Spinner } from '../components/ui'
import { apiError } from '../config/api'
import type { EscalationPolicy, EscalationRule, TargetType } from '../types'

function blankRule(): EscalationRule {
  return { delay_minutes: 30, targets: [{ target_type: 'user', target_id: '' }] }
}

export default function EscalationPoliciesPage() {
  const { data: policies, isLoading } = usePolicies()
  const { data: users } = useUsers()
  const { data: schedules } = useSchedules()
  const { create, update, remove } = usePolicyMutations()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EscalationPolicy | null>(null)
  const [name, setName] = useState('')
  const [repeat, setRepeat] = useState(0)
  const [rules, setRules] = useState<EscalationRule[]>([blankRule()])
  const [error, setError] = useState('')

  const openCreate = () => {
    setEditing(null)
    setName('')
    setRepeat(0)
    setRules([blankRule()])
    setError('')
    setOpen(true)
  }

  const openEdit = (p: EscalationPolicy) => {
    setEditing(p)
    setName(p.name)
    setRepeat(p.repeat_count)
    setRules(
      (p.rules ?? []).map((r) => ({
        delay_minutes: r.delay_minutes,
        targets: r.targets.map((t) => ({ target_type: t.target_type, target_id: t.target_id })),
      })),
    )
    setError('')
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (rules.some((r) => r.targets.some((t) => !t.target_id))) {
      setError('Every target must be selected.')
      return
    }
    const body = { name, repeat_count: repeat, rules }
    try {
      if (editing) await update.mutateAsync({ id: editing.id, body })
      else await create.mutateAsync(body)
      setOpen(false)
    } catch (err) {
      setError(apiError(err))
    }
  }

  const targetName = (type: TargetType, id: string) =>
    type === 'user'
      ? users?.find((u) => u.id === id)?.name ?? 'user'
      : schedules?.find((s) => s.id === id)?.name ?? 'schedule'
  const saving = create.isPending || update.isPending

  return (
    <div>
      <PageHeader
        title="Escalation Policies"
        subtitle="Who gets paged and when the incident escalates to the next level."
        action={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> New policy
          </button>
        }
      />

      {isLoading ? (
        <div className="card flex justify-center py-12"><Spinner /></div>
      ) : (policies ?? []).length === 0 ? (
        <EmptyState title="No escalation policies yet" hint="Create a policy, then attach it to a service." />
      ) : (
        <div className="space-y-3">
          {policies?.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600/15 text-brand-400">
                    <GitBranch size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {p.rules?.length ?? 0} levels · repeats {p.repeat_count}×
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="btn-ghost px-1.5 text-slate-500 hover:text-slate-200" onClick={() => openEdit(p)}>
                    <Pencil size={15} />
                  </button>
                  <button className="btn-ghost px-1.5 text-slate-500 hover:text-red-400" onClick={() => remove.mutate(p.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <ol className="mt-3 space-y-2">
                {p.rules?.map((r, i) => (
                  <li key={r.id ?? i} className="flex items-center gap-3 rounded-lg bg-surface-850 px-3 py-2 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600/20 text-xs font-bold text-brand-300">
                      {i + 1}
                    </span>
                    <div className="flex flex-1 flex-wrap gap-1.5">
                      {r.targets.map((t, ti) => (
                        <span key={ti} className="badge bg-surface-800 text-slate-300">
                          {t.target_type === 'user' ? <Users size={12} /> : <CalendarClock size={12} />}
                          {targetName(t.target_type, t.target_id)}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">wait {r.delay_minutes}m</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit escalation policy' : 'New escalation policy'} wide>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Repeat (×)</label>
              <input type="number" min={0} max={10} className="input" value={repeat} onChange={(e) => setRepeat(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-3">
            {rules.map((rule, ri) => (
              <div key={ri} className="rounded-lg border border-surface-700 bg-surface-850 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-200">Level {ri + 1}</span>
                  {rules.length > 1 && (
                    <button type="button" className="text-slate-500 hover:text-red-400" onClick={() => setRules(rules.filter((_, i) => i !== ri))}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {rule.targets.map((t, ti) => (
                    <div key={ti} className="flex gap-2">
                      <select
                        className="input w-32"
                        value={t.target_type}
                        onChange={(e) => {
                          const next = [...rules]
                          next[ri].targets[ti] = { target_type: e.target.value as TargetType, target_id: '' }
                          setRules(next)
                        }}
                      >
                        <option value="user">User</option>
                        <option value="schedule">Schedule</option>
                      </select>
                      <select
                        className="input flex-1"
                        value={t.target_id}
                        onChange={(e) => {
                          const next = [...rules]
                          next[ri].targets[ti].target_id = e.target.value
                          setRules(next)
                        }}
                        required
                      >
                        <option value="">— select —</option>
                        {(t.target_type === 'user' ? users : schedules)?.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                      {rule.targets.length > 1 && (
                        <button
                          type="button"
                          className="btn-ghost px-2 text-slate-500 hover:text-red-400"
                          onClick={() => {
                            const next = [...rules]
                            next[ri].targets = next[ri].targets.filter((_, i) => i !== ti)
                            setRules(next)
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    className="text-xs font-medium text-brand-400 hover:text-brand-300"
                    onClick={() => {
                      const next = [...rules]
                      next[ri].targets.push({ target_type: 'user', target_id: '' })
                      setRules(next)
                    }}
                  >
                    + target
                  </button>
                  <label className="flex items-center gap-2 text-xs text-slate-400">
                    Escalate after
                    <input
                      type="number"
                      min={0}
                      className="input w-20 py-1"
                      value={rule.delay_minutes}
                      onChange={(e) => {
                        const next = [...rules]
                        next[ri].delay_minutes = Number(e.target.value)
                        setRules(next)
                      }}
                    />
                    min
                  </label>
                </div>
              </div>
            ))}
            <button type="button" className="btn-outline w-full" onClick={() => setRules([...rules, blankRule()])}>
              <Plus size={15} /> Add level
            </button>
          </div>

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Spinner /> : 'Save policy'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
