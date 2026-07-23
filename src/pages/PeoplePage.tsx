import { useState } from 'react'
import { Plus, Trash2, Users, Mail, Phone, UserPlus } from 'lucide-react'
import { useInviteMember, useTeamMutations, useTeams, useUsers } from '../lib/queries'
import { EmptyState, Modal, PageHeader, Spinner } from '../components/ui'
import { apiError } from '../config/api'

export default function PeoplePage() {
  const { data: users, isLoading } = useUsers()
  const { data: teams } = useTeams()
  const { create, remove, addMember, removeMember } = useTeamMutations()
  const invite = useInviteMember()

  const [teamOpen, setTeamOpen] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamError, setTeamError] = useState('')

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', password: '' })
  const [inviteError, setInviteError] = useState('')

  const [addTo, setAddTo] = useState<string | null>(null)

  const submitTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setTeamError('')
    try {
      await create.mutateAsync({ name: teamName })
      setTeamOpen(false)
      setTeamName('')
    } catch (err) {
      setTeamError(apiError(err))
    }
  }

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError('')
    try {
      await invite.mutateAsync(inviteForm)
      setInviteOpen(false)
      setInviteForm({ name: '', email: '', password: '' })
    } catch (err) {
      setInviteError(apiError(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="People & Teams"
        subtitle="Members of your organization and their teams."
        action={
          <button className="btn-primary" onClick={() => setInviteOpen(true)}>
            <UserPlus size={16} /> Invite member
          </button>
        }
      />

      <section className="mb-8">
        <h2 className="mb-3 font-semibold text-white">Members</h2>
        {isLoading ? (
          <div className="card flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="card divide-y divide-surface-800">
            {users?.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/20 text-xs font-bold text-brand-300">
                  {u.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-100">{u.name}</p>
                  <p className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><Mail size={12} /> {u.email}</span>
                    {u.phone && <span className="inline-flex items-center gap-1"><Phone size={12} /> {u.phone}</span>}
                  </p>
                </div>
                <div className="flex gap-1">
                  {u.notify_email && <span className="badge bg-surface-800 text-slate-400">Email</span>}
                  {u.notify_sms && <span className="badge bg-surface-800 text-slate-400">SMS</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-white">Teams</h2>
          <button className="btn-outline" onClick={() => setTeamOpen(true)}>
            <Plus size={16} /> New team
          </button>
        </div>
        {(teams ?? []).length === 0 ? (
          <EmptyState title="No teams yet" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {teams?.map((t) => (
              <div key={t.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600/15 text-brand-400">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.members?.length ?? 0} members</p>
                    </div>
                  </div>
                  <button className="btn-ghost px-1.5 text-slate-500 hover:text-red-400" onClick={() => remove.mutate(t.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.members?.map((m) => (
                    <span key={m.id} className="badge bg-surface-800 text-slate-300">
                      {m.name}
                      <button className="text-slate-500 hover:text-red-400" onClick={() => removeMember.mutate({ teamId: t.id, userId: m.id })}>
                        <Trash2 size={11} />
                      </button>
                    </span>
                  ))}
                  {addTo === t.id ? (
                    <select
                      autoFocus
                      className="input w-40 py-1 text-xs"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) addMember.mutate({ teamId: t.id, userId: e.target.value })
                        setAddTo(null)
                      }}
                      onBlur={() => setAddTo(null)}
                    >
                      <option value="">— select —</option>
                      {users
                        ?.filter((u) => !t.members?.some((m) => m.id === u.id))
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <button className="badge bg-surface-800 text-brand-400 hover:text-brand-300" onClick={() => setAddTo(t.id)}>
                      <UserPlus size={12} /> add
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite member">
        <form onSubmit={submitInvite} className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Temporary password</label>
            <input className="input" value={inviteForm.password} onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })} required minLength={6} />
            <p className="mt-1 text-xs text-slate-500">Share it with them; they can change it later in Profile.</p>
          </div>
          {inviteError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{inviteError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setInviteOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={invite.isPending}>
              {invite.isPending ? <Spinner /> : 'Invite'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={teamOpen} onClose={() => setTeamOpen(false)} title="New team">
        <form onSubmit={submitTeam} className="space-y-3">
          <div>
            <label className="label">Team name</label>
            <input className="input" value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
          </div>
          {teamError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{teamError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setTeamOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={create.isPending}>
              {create.isPending ? <Spinner /> : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
