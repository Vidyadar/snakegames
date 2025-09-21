import { NhostClient } from "@nhost/nextjs"

// Check if Nhost is properly configured
const isNhostConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN && process.env.NEXT_PUBLIC_NHOST_REGION)
}

let nhost: NhostClient | null = null

const initializeNhost = () => {
  if (nhost || typeof window === "undefined") {
    return nhost
  }

  try {
    if (isNhostConfigured()) {
      nhost = new NhostClient({
        subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN!,
        region: process.env.NEXT_PUBLIC_NHOST_REGION!,
        clientUrl: window.location.origin,
      })
      console.log("[v0] Nhost initialized with clientUrl:", window.location.origin)
    } else {
      console.warn("Nhost not configured. Using offline mode.")
    }
  } catch (error) {
    console.warn("Nhost initialization failed. Using offline mode.", error)
  }

  return nhost
}

const getNhost = () => {
  if (typeof window === "undefined") {
    return null // Return null on server side
  }
  return initializeNhost()
}

export { getNhost as nhost, isNhostConfigured }
