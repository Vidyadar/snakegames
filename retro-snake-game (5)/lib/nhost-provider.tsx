"use client"

import { NhostProvider as BaseNhostProvider } from "@nhost/nextjs"
import { nhost } from "./nhost"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"

interface NhostProviderProps {
  children: ReactNode
}

export function NhostProvider({ children }: NhostProviderProps) {
  const [nhostClient, setNhostClient] = useState<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const client = nhost()
    setNhostClient(client)
    setIsInitialized(true)
  }, [])

  if (!isInitialized) {
    return <>{children}</>
  }

  if (!nhostClient) {
    // If Nhost is not configured, just render children without provider
    return <>{children}</>
  }

  return <BaseNhostProvider nhost={nhostClient}>{children}</BaseNhostProvider>
}
