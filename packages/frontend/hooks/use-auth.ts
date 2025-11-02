import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'

interface User {
  id: string
  email: string
  name?: string
  subscription?: {
    tier: string
    status: string
  }
}

interface AuthStore {
  user: User | null
  loading: boolean
  error: string | null
  setUser: (user: User | null) => void
  fetchUser: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),

  fetchUser: async () => {
    try {
      set({ loading: true, error: null })
      const user = await apiClient.getMe()
      set({ user, loading: false })
    } catch (error) {
      set({ user: null, loading: false, error: 'Failed to fetch user' })
    }
  },

  logout: async () => {
    try {
      await apiClient.logout()
      set({ user: null })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  },
}))
