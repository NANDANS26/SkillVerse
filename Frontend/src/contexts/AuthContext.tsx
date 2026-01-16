import React, { createContext, useContext, useState, useEffect } from 'react'

type UserRole = 'candidate' | 'recruiter' | 'admin'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Change this if your backend URL/port is different
const API_BASE_URL = 'http://localhost:3000/api'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }, [user])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      // Expected backend response: { success: true, user: {...}, token: "..." }
      if (!res.ok || !data.success || !data.user) {
        setIsLoading(false)
        return false
      }

      const loggedInUser: User = {
        id: String(data.user.id),
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as UserRole
      }

      setUser(loggedInUser)
      if (data.token) {
        localStorage.setItem('token', data.token)
      }

      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      return false
    }
  }

  const signup = async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<boolean> => {
    try {
      setIsLoading(true)

      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, role })
      })

      const data = await res.json()

      // Expected backend response: { success: true, user: {...}, token: "..." }
      if (!res.ok || !data.success || !data.user) {
        setIsLoading(false)
        return false
      }

      const newUser: User = {
        id: String(data.user.id),
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as UserRole
      }

      setUser(newUser)
      if (data.token) {
        localStorage.setItem('token', data.token)
      }

      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Signup error:', error)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
