import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../config/api'
import type { User } from '../types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, organizationName: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<string>
  setUser: (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),

      setUser: (user) => set({ user }),

      login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        const { access_token, refresh_token, user } = res.data.data
        set({ user, accessToken: access_token, refreshToken: refresh_token, isAuthenticated: true })
      },

      register: async (name, email, password, organizationName) => {
        const res = await api.post('/auth/register', {
          name,
          email,
          password,
          organization_name: organizationName,
        })
        const { access_token, refresh_token, user } = res.data.data
        set({ user, accessToken: access_token, refreshToken: refresh_token, isAuthenticated: true })
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch {
          // ignore
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      refresh: async () => {
        const { refreshToken } = get()
        const res = await api.post('/auth/refresh', { refresh_token: refreshToken })
        const { access_token, refresh_token, user } = res.data.data
        set({ user, accessToken: access_token, refreshToken: refresh_token })
        return access_token as string
      },
    }),
    { name: 'siaga-auth' },
  ),
)
