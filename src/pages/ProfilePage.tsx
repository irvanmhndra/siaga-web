import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useUpdateProfile } from '../lib/queries'
import { PageHeader, Spinner } from '../components/ui'
import { apiError } from '../config/api'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const update = useUpdateProfile()
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    timezone: user?.timezone ?? 'Asia/Jakarta',
    notify_email: user?.notify_email ?? true,
    notify_sms: user?.notify_sms ?? false,
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaved(false)
    try {
      await update.mutateAsync({
        name: form.name,
        phone: form.phone || undefined,
        timezone: form.timezone,
        notify_email: form.notify_email,
        notify_sms: form.notify_sms,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(apiError(err))
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Profile & Notifications" subtitle="Manage your contact info and notification channels." />

      <form onSubmit={submit} className="card space-y-4 p-5">
        <div>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input opacity-60" value={user?.email ?? ''} disabled />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Phone number</label>
            <input className="input" placeholder="+62…" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Timezone</label>
            <input className="input" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2 rounded-lg bg-surface-850 p-3">
          <p className="text-sm font-medium text-slate-300">Notification channels</p>
          <label className="flex items-center justify-between text-sm text-slate-300">
            Email
            <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={form.notify_email} onChange={(e) => setForm({ ...form, notify_email: e.target.checked })} />
          </label>
          <label className="flex items-center justify-between text-sm text-slate-300">
            SMS &amp; voice call (requires phone number)
            <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={form.notify_sms} onChange={(e) => setForm({ ...form, notify_sms: e.target.checked })} />
          </label>
          <p className="text-xs text-slate-500">
            In-app is always on. Email/SMS are delivered when the server is configured (SMTP/Twilio).
          </p>
        </div>

        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
          <button type="submit" className="btn-primary" disabled={update.isPending}>
            {update.isPending ? <Spinner /> : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
