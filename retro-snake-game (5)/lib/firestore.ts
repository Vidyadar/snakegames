import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  where,
  getDocs,
} from "firebase/firestore"
import { db, isFirebaseConfigured } from "./firebase"

export interface LeaderboardEntry {
  id?: string
  playerId: string
  playerName: string
  score: number
  timestamp: any
}

// Add a new score to the leaderboard
export const addScore = async (playerId: string, playerName: string, score: number) => {
  if (!isFirebaseConfigured() || !db) {
    // Fallback to localStorage
    const savedScores = localStorage.getItem("snakeLeaderboard")
    const scores = savedScores ? JSON.parse(savedScores) : []
    const newEntry = {
      id: playerId,
      playerId,
      playerName,
      score,
      timestamp: Date.now(),
    }
    const filtered = scores.filter((entry: any) => entry.playerId !== playerId || entry.score < score)
    const updated = [...filtered, newEntry].sort((a: any, b: any) => b.score - a.score).slice(0, 10)
    localStorage.setItem("snakeLeaderboard", JSON.stringify(updated))
    return playerId
  }

  try {
    const docRef = await addDoc(collection(db, "leaderboard"), {
      playerId,
      playerName,
      score,
      timestamp: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding score:", error)
    // Fallback to localStorage
    const savedScores = localStorage.getItem("snakeLeaderboard")
    const scores = savedScores ? JSON.parse(savedScores) : []
    const newEntry = {
      id: playerId,
      playerId,
      playerName,
      score,
      timestamp: Date.now(),
    }
    const filtered = scores.filter((entry: any) => entry.playerId !== playerId || entry.score < score)
    const updated = [...filtered, newEntry].sort((a: any, b: any) => b.score - a.score).slice(0, 10)
    localStorage.setItem("snakeLeaderboard", JSON.stringify(updated))
    return playerId
  }
}

// Get top scores with real-time updates
export const subscribeToLeaderboard = (callback: (scores: LeaderboardEntry[]) => void) => {
  if (!isFirebaseConfigured() || !db) {
    // Fallback to localStorage with polling
    const loadLocalScores = () => {
      const savedScores = localStorage.getItem("snakeLeaderboard")
      const scores = savedScores ? JSON.parse(savedScores) : []
      callback(scores)
    }

    loadLocalScores()
    const interval = setInterval(loadLocalScores, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }

  const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(10))

  return onSnapshot(
    q,
    (querySnapshot) => {
      const scores: LeaderboardEntry[] = []
      querySnapshot.forEach((doc) => {
        scores.push({
          id: doc.id,
          ...doc.data(),
        } as LeaderboardEntry)
      })
      callback(scores)
    },
    (error) => {
      console.error("Firestore subscription error:", error)
      // Fallback to localStorage
      const savedScores = localStorage.getItem("snakeLeaderboard")
      const scores = savedScores ? JSON.parse(savedScores) : []
      callback(scores)
    },
  )
}

// Get player's best score
export const getPlayerBestScore = async (playerId: string): Promise<number> => {
  if (!isFirebaseConfigured() || !db) {
    // Fallback to localStorage
    const savedScores = localStorage.getItem("snakeLeaderboard")
    const scores = savedScores ? JSON.parse(savedScores) : []
    const playerScores = scores.filter((entry: any) => entry.playerId === playerId)
    return playerScores.length > 0 ? Math.max(...playerScores.map((s: any) => s.score)) : 0
  }

  try {
    const q = query(
      collection(db, "leaderboard"),
      where("playerId", "==", playerId),
      orderBy("score", "desc"),
      limit(1),
    )

    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return doc.data().score
    }
    return 0
  } catch (error) {
    console.error("Error getting player best score:", error)
    // Fallback to localStorage
    const savedScores = localStorage.getItem("snakeLeaderboard")
    const scores = savedScores ? JSON.parse(savedScores) : []
    const playerScores = scores.filter((entry: any) => entry.playerId === playerId)
    return playerScores.length > 0 ? Math.max(...playerScores.map((s: any) => s.score)) : 0
  }
}
