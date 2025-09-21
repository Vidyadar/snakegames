import { nhost, isNhostConfigured } from "./nhost"

export interface User {
  id: string
  isAnonymous: boolean
  displayName?: string
}

// Sign in anonymously to get a unique user ID
export const signInAnonymous = async (): Promise<User | null> => {
  const nhostClient = nhost()
  if (!isNhostConfigured() || !nhostClient) {
    throw new Error("Nhost not configured")
  }

  try {
    const randomId = Math.random().toString(36).substr(2, 9)
    const email = `anonymous_${randomId}@temp.com`
    const password = `temp_${randomId}`

    const result = await nhostClient.auth.signUp({
      email,
      password,
      options: {
        displayName: generateDisplayName(randomId),
      },
    })

    if (result.user) {
      return {
        id: result.user.id,
        isAnonymous: true,
        displayName: result.user.displayName || generateDisplayName(result.user.id),
      }
    }
    return null
  } catch (error) {
    console.error("Error signing in anonymously:", error)
    throw error
  }
}

// Listen for authentication state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  const nhostClient = nhost()
  if (!isNhostConfigured() || !nhostClient) {
    throw new Error("Nhost not configured")
  }

  return nhostClient.auth.onAuthStateChanged((event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        isAnonymous: true,
        displayName: session.user.displayName || generateDisplayName(session.user.id),
      })
    } else {
      callback(null)
    }
  })
}

// Get current user
export const getCurrentUser = (): User | null => {
  const nhostClient = nhost()
  if (!nhostClient?.auth.getUser()) return null
  const user = nhostClient.auth.getUser()
  return user
    ? {
        id: user.id,
        isAnonymous: true,
        displayName: user.displayName || generateDisplayName(user.id),
      }
    : null
}

// Generate a display name for anonymous users
export const generateDisplayName = (uid: string): string => {
  const adjectives = ["Swift", "Clever", "Mighty", "Quick", "Bold", "Sharp", "Brave", "Smart"]
  const animals = ["Snake", "Viper", "Cobra", "Python", "Adder", "Mamba", "Boa", "Asp"]

  const adjIndex = uid.charCodeAt(0) % adjectives.length
  const animalIndex = uid.charCodeAt(1) % animals.length
  const number = uid.slice(-3)

  return `${adjectives[adjIndex]}${animals[animalIndex]}${number}`
}
