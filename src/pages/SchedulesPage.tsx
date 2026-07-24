import { useState } from 'react'
import { CalendarClock, CalendarPlus, Pencil, Plus, Trash2, UserCheck } from 'lucide-react'
import { useSchedule, useScheduleMutations, useSchedules, useUsers } from '../lib/queries'
import { EmptyState, Modal, PageHeader, Spinner } from '../components/ui'
import { apiError } from '../config/api'
import { resolveOnCall } from '../lib/oncall'
import { formatDateTime } from '../lib/format'
import type { Schedule, User } from '../types'

interface LayerForm {
  name: string
  rotation_length_days: number
  start_at: string
  user_ids: string[]
}

function blankLayer(): LayerForm {
  return {
    name: 'Layer 1',
    rotation_length_days: 7,
    start_at: new Date().toISOString().slice(0, 16),
    user_ids: [],
  }
}

export default function SchedulesPage() {
  const { data: schedules, isLoading } = useSchedules()
  const { data: users } = useUsers()
  const { create, update, remove } = useScheduleMutations()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [overrideFor, setOverrideFor] = useState<Schedule | null>(null)
  const [name, setName] = useState('')
  const [tz, setTz] = useState('Asia/Jakarta')
  const [layers, setLayers] = useState<LayerForm[]>([blankLayer()])
  const [error, setError] = useState('')

  const openCreate = () => {
    setEditing(null)
    setName('')
    setTz('Asia/Jakarta')
    setLayers([blankLayer()])
    setError('')
    setOpen(true)
  }

  const openEdit = (s: Schedule) => {
    setEditing(s)
    setName(s.name)
    setTz(s.timezone)
    setLayers(
      (s.layers ?? []).map((l) => ({
        name: l.name,
        rotation_length_days: l.rotation_length_days,
        start_at: new Date(l.start_at).toISOString().slice(0, 16),
        user_ids: l.user_ids,
      })),
    )
    setError('')
    setOpen(true)
  }

  const userName = (id?: string) => users?.find((u) => u.id === id)?.name ?? '—'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (layers.some((l) => l.user_ids.length === 0)) {
      setError('Every layer needs at least one member.')
      return
    }
    const body = {
      name,
      timezone: tz,
      layers: layers.map((l) => ({
        name: l.name,
        rotation_type: 'custom',
        rotation_length_days: l.rotation_length_days,
        start_at: new Date(l.start_at).toISOString(),
        user_ids: l.user_ids,
      })),
    }
    try {
      if (editing) await update.mutateAsync({ id: editing.id, body })
      else await create.mutateAsync(body)
      setOpen(false)
    } catch (err) {
      setError(apiError(err))
    }
  }

  const toggleMember = (li: number, uid: string) => {
    const next = [...layers]
    const set = new Set(next[li].user_ids)
    if (set.has(uid)) set.delete(uid)
    else set.add(uid)
    next[li].user_ids = [...set]
    setLayers(next)
  }
  const saving = create.isPending || update.isPending

  return (
    <div>
      <PageHeader
        title="On-Call Schedules"
        subtitle="Rotations for who is on duty. On-call is computed automatically from layers and rotation."
        action={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> New schedule
          </button>
        }
      />

      {isLoading ? (
        <div className="card flex justify-center py-12"><Spinner /></div>
      ) : (schedules ?? []).length === 0 ? (
        <EmptyState title="No on-call schedules yet" hint="Create a schedule, then use it as a target in an escalation policy." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {schedules?.map((s) => (
            <div key={s.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600/15 text-brand-400">
                    <CalendarClock size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.timezone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="btn-ghost px-1.5 text-slate-500 hover:text-brand-300" title="Overrides" onClick={() => setOverrideFor(s)}>
                    <CalendarPlus size={16} />
                  </button>
                  <button className="btn-ghost px-1.5 text-slate-500 hover:text-slate-200" title="Edit" onClick={() => openEdit(s)}>
                    <Pencil size={15} />
                  </button>
                  <button className="btn-ghost px-1.5 text-slate-500 hover:text-red-400" title="Delete" onClick={() => remove.mutate(s.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface-850 px-3 py-2 text-sm">
                <UserCheck size={15} className="text-brand-400" />
                <span className="text-slate-400">On-call now:</span>
                <span className="font-medium text-slate-200">{userName(resolveOnCall(s) ?? undefined)}</span>
              </div>
              {s.layers?.map((l) => (
                <p key={l.id} className="mt-2 text-xs text-slate-500">
                  {l.name}: rotates every {l.rotation_length_days}d · {l.user_ids.length} members
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit schedule' : 'New on-call schedule'} wide>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Timezone</label>
              <input className="input" value={tz} onChange={(e) => setTz(e.target.value)} />
            </div>
          </div>

          {layers.map((layer, li) => (
            <div key={li} className="rounded-lg border border-surface-700 bg-surface-850 p-3">
              <div className="mb-2 flex items-center justify-between">
                <input
                  className="input w-40 py-1"
                  value={layer.name}
                  onChange={(e) => {
                    const next = [...layers]
                    next[li].name = e.target.value
                    setLayers(next)
                  }}
                />
                {layers.length > 1 && (
                  <button type="button" className="text-slate-500 hover:text-red-400" onClick={() => setLayers(layers.filter((_, i) => i !== li))}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  Rotate every
                  <input
                    type="number"
                    min={1}
                    className="input w-16 py-1"
                    value={layer.rotation_length_days}
                    onChange={(e) => {
                      const next = [...layers]
                      next[li].rotation_length_days = Number(e.target.value)
                      setLayers(next)
                    }}
                  />
                  days
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  Starts
                  <input
                    type="datetime-local"
                    className="input flex-1 py-1"
                    value={layer.start_at}
                    onChange={(e) => {
                      const next = [...layers]
                      next[li].start_at = e.target.value
                      setLayers(next)
                    }}
                  />
                </label>
              </div>
              <div className="mt-2">
                <p className="label !mb-1 text-xs">Rotation members (in order)</p>
                <div className="flex flex-wrap gap-1.5">
                  {users?.map((u) => {
                    const on = layer.user_ids.includes(u.id)
                    return (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => toggleMember(li, u.id)}
                        className={`badge cursor-pointer ${on ? 'bg-brand-600 text-white' : 'bg-surface-800 text-slate-400'}`}
                      >
                        {on && layer.user_ids.indexOf(u.id) + 1 + '. '}
                        {u.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
          <button type="button" className="btn-outline w-full" onClick={() => setLayers([...layers, { ...blankLayer(), name: `Layer ${layers.length + 1}` }])}>
            <Plus size={15} /> Add layer
          </button>

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Spinner /> : 'Save schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {overrideFor && (
        <OverrideModal schedule={overrideFor} users={users ?? []} onClose={() => setOverrideFor(null)} />
      )}
    </div>
  )
}

function OverrideModal({ schedule, users, onClose }: { schedule: Schedule; users: User[]; onClose: () => void }) {
  const { data: full, isLoading } = useSchedule(schedule.id)
  const { addOverride, deleteOverride } = useScheduleMutations()
  const [userId, setUserId] = useState('')
  const [startAt, setStartAt] = useState(new Date().toISOString().slice(0, 16))
  const [endAt, setEndAt] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16))
  const [error, setError] = useState('')

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? id
  const overrides = full?.overrides ?? []

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (new Date(endAt) <= new Date(startAt)) {
      setError('End must be after start.')
      return
    }
    try {
      await addOverride.mutateAsync({
        scheduleId: schedule.id,
        body: { user_id: userId, start_at: new Date(startAt).toISOString(), end_at: new Date(endAt).toISOString() },
      })
      setUserId('')
    } catch (err) {
      setError(apiError(err))
    }
  }

  return (
    <Modal open onClose={onClose} title={`Overrides — ${schedule.name}`}>
      <p className="mb-4 text-sm text-slate-400">
        Temporarily put a specific person on-call for a window. Overrides win over the rotation.
      </p>

      <div className="mb-4 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-4"><Spinner /></div>
        ) : overrides.length === 0 ? (
          <p className="rounded-lg bg-surface-850 px-3 py-3 text-center text-sm text-slate-500">No overrides yet</p>
        ) : (
          overrides.map((o) => (
            <div key={o.id} className="flex items-center gap-2 rounded-lg bg-surface-850 px-3 py-2 text-sm">
              <UserCheck size={14} className="text-brand-400" />
              <span className="font-medium text-slate-200">{userName(o.user_id)}</span>
              <span className="text-xs text-slate-500">{formatDateTime(o.start_at)} → {formatDateTime(o.end_at)}</span>
              <button
                className="ml-auto text-slate-500 hover:text-red-400"
                onClick={() => deleteOverride.mutate({ scheduleId: schedule.id, overrideId: o.id })}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={add} className="space-y-3 border-t border-surface-800 pt-4">
        <div>
          <label className="label">Person</label>
          <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)} required>
            <option value="">— select —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">From</label>
            <input type="datetime-local" className="input" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
          </div>
          <div>
            <label className="label">Until</label>
            <input type="datetime-local" className="input" value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
          </div>
        </div>
        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={addOverride.isPending}>
            {addOverride.isPending ? <Spinner /> : 'Add override'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
