import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchMe, loginMember, logoutMember, registerMember, verifyMemberEmail } from '../lib/api'
import type { Member } from '../types'

type RegisterResult = {
  pending: boolean
  message: string
  verifyUrl?: string
  emailTestMode?: boolean
  canLogin?: boolean
}

type AuthContextValue = {
  member: Member | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: {
    name: string
    email: string
    password: string
    zip?: string
    address?: string
  }) => Promise<RegisterResult>
  verifyEmail: (token: string) => Promise<void>
  logout: () => Promise<void>
  setMember: (member: Member | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMe()
      .then(setMember)
      .catch(() => setMember(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setMember(await loginMember({ email, password }))
  }, [])

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; zip?: string; address?: string }) => {
      return registerMember(payload)
    },
    [],
  )

  const verifyEmail = useCallback(async (token: string) => {
    setMember(await verifyMemberEmail(token))
  }, [])

  const logout = useCallback(async () => {
    await logoutMember()
    setMember(null)
  }, [])

  const value = useMemo(
    () => ({ member, loading, login, register, verifyEmail, logout, setMember }),
    [member, loading, login, register, verifyEmail, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
