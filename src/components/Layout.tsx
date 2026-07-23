import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  Boxes,
  CalendarClock,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Users,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useNotifications, useNotificationActions } from '../lib/queries'
import { timeAgo } from '../lib/format'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { to: '/services', label: 'Services', icon: Boxes },
  { to: '/schedules', label: 'On-Call Schedules', icon: CalendarClock },
  { to: '/escalation-policies', label: 'Escalation Policies', icon: GitBranch },
  { to: '/people', label: 'People & Teams', icon: Users },
]

export default function Layout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [bellOpen, setBellOpen] = useState(false)
  const { data: notif } = useNotifications()
  const { markAllRead, markRead } = useNotificationActions()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-surface-950">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-surface-800 bg-surface-900 md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <img src="/siaga.svg" alt="" className="h-8 w-8" />
          <span className="text-lg font-extrabold tracking-tight text-white">Siaga</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600/15 text-brand-300'
                    : 'text-slate-400 hover:bg-surface-800 hover:text-slate-200'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-surface-800 p-3">
          <NavLink
            to="/profile"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-surface-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600/20 text-xs font-bold text-brand-300">
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-200">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </NavLink>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-surface-800 bg-surface-900/70 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <img src="/siaga.svg" alt="" className="h-7 w-7" />
            <span className="font-extrabold text-white">Siaga</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button className="btn-ghost relative px-2" onClick={() => setBellOpen((v) => !v)}>
                <Bell size={20} />
                {(notif?.unread ?? 0) > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                    {notif?.unread}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 top-11 z-50 w-80 card p-0">
                  <div className="flex items-center justify-between border-b border-surface-800 px-4 py-3">
                    <span className="text-sm font-semibold text-white">Notifications</span>
                    <button
                      className="text-xs text-brand-400 hover:text-brand-300"
                      onClick={() => markAllRead.mutate()}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {(notif?.items ?? []).length === 0 && (
                      <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet</p>
                    )}
                    {notif?.items.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markRead.mutate(n.id)}
                        className={`flex w-full flex-col items-start gap-0.5 border-b border-surface-800/60 px-4 py-3 text-left hover:bg-surface-800 ${
                          n.read_at ? 'opacity-60' : ''
                        }`}
                      >
                        <span className="text-sm text-slate-200">{n.message}</span>
                        <span className="text-xs text-slate-500">{timeAgo(n.created_at)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="btn-ghost px-2" onClick={handleLogout} title="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-surface-800 bg-surface-900 px-2 py-2 md:hidden">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  isActive ? 'bg-brand-600/15 text-brand-300' : 'text-slate-400'
                }`
              }
            >
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
