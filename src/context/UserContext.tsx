'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface UserData {
  id: string
  email: string
  name: string
  picture?: string
}

interface UserContextType {
  user: UserData | null
  loading: boolean
  login: (returnTo?: string) => void
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  refresh: async () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      setUser(data.user || null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const login = (returnTo?: string) => {
    const url = returnTo 
      ? `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`
      : '/api/auth/google'
    window.location.href = url
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const refresh = async () => {
    setLoading(true)
    await fetchUser()
  }

  return (
    <UserContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
