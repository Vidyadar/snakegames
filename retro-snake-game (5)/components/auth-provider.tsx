"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User } from "@/lib/auth"
import { signInAnonymous, onAuthStateChange, generateDisplayName } from "@/lib/auth"
import { isNhostConfigured } from "@/lib/nhost"

interface AuthContextType {
  user: User | null
  displayName: string
  loading: boolean
  signIn: () => Promise<void>
  isOffline: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState("")
  const [isOffline, setIsOffline] = useState(true)

  const signIn = async () => {
    if (isOffline) {
      // Generate offline user
      const offlineUser = {
        id: localStorage.getItem("offlineUserId") || `offline_${Math.random().toString(36).substr(2, 9)}`,
        isAnonymous: true,
      } as User

      if (!localStorage.getItem("offlineUserId")) {
        localStorage.setItem("offlineUserId", offlineUser.id)
      }

      setUser(offlineUser)
      const name = generateDisplayName(offlineUser.id)
      setDisplayName(name)
      localStorage.setItem("snakeDisplayName", name)
      return
    }

    try {
      const user = await signInAnonymous()
      if (user) {
        const name = user.displayName || generateDisplayName(user.id)
        setDisplayName(name)
        localStorage.setItem("snakeDisplayName", name)
      }
    } catch (error) {
      console.error("Auth failed, switching to offline mode:", error)
      setIsOffline(true)
      await signIn() // Retry in offline mode
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      if (!isNhostConfigured()) {
        console.log("[v0] Nhost not configured, using offline mode")
        setIsOffline(true)
        await signIn()
        setLoading(false)
        return
      }

      // Try to use Nhost, but with a timeout
      const timeoutId = setTimeout(() => {
        console.log("[v0] Nhost timeout, switching to offline mode")
        setIsOffline(true)
        signIn()
        setLoading(false)
      }, 3000) // 3 second timeout

      try {
        const unsubscribe = onAuthStateChange((user) => {
          clearTimeout(timeoutId)
          setIsOffline(false) // Successfully connected to Nhost
          setUser(user)

          if (user) {
            let name = localStorage.getItem("snakeDisplayName")
            if (!name) {
              name = user.displayName || generateDisplayName(user.id)
              localStorage.setItem("snakeDisplayName", name)
            }
            setDisplayName(name)
          } else {
            setDisplayName("")
            signIn()
          }

          setLoading(false)
        })

        return () => {
          clearTimeout(timeoutId)
          unsubscribe()
        }
      } catch (error) {
        clearTimeout(timeoutId)
        console.error("[v0] Nhost auth setup failed, switching to offline mode:", error)
        setIsOffline(true)
        await signIn()
        setLoading(false)
      }
    }

    const offlineUserId = localStorage.getItem("offlineUserId")
    if (offlineUserId) {
      const offlineUser = { id: offlineUserId, isAnonymous: true } as User
      setUser(offlineUser)

      let name = localStorage.getItem("snakeDisplayName")
      if (!name) {
        name = generateDisplayName(offlineUserId)
        localStorage.setItem("snakeDisplayName", name)
      }
      setDisplayName(name)
    } else {
      signIn()
    }
    setLoading(false)

    // Try to initialize Nhost in the background
    if (isNhostConfigured()) {
      initializeAuth()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, displayName, loading, signIn, isOffline }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
