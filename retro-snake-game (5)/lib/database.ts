import { nhost, isNhostConfigured } from "./nhost"

export interface LeaderboardEntry {
  id?: string
  playerId: string
  playerName: string
  score: number
  timestamp: string
}

// GraphQL queries and mutations
const ADD_SCORE_MUTATION = `
  mutation AddScore($playerId: String!, $playerName: String!, $score: Int!) {
    insert_leaderboard_one(object: {
      player_id: $playerId,
      player_name: $playerName,
      score: $score
    }) {
      id
      player_id
      player_name
      score
      created_at
    }
  }
`

const GET_LEADERBOARD_QUERY = `
  query GetLeaderboard {
    leaderboard(order_by: {score: desc}, limit: 10) {
      id
      player_id
      player_name
      score
      created_at
    }
  }
`

const LEADERBOARD_SUBSCRIPTION = `
  subscription LeaderboardSubscription {
    leaderboard(order_by: {score: desc}, limit: 10) {
      id
      player_id
      player_name
      score
      created_at
    }
  }
`

const GET_PLAYER_BEST_SCORE_QUERY = `
  query GetPlayerBestScore($playerId: String!) {
    leaderboard(where: {player_id: {_eq: $playerId}}, order_by: {score: desc}, limit: 1) {
      score
    }
  }
`

// Add a new score to the leaderboard
export const addScore = async (playerId: string, playerName: string, score: number) => {
  const nhostClient = nhost()
  if (!isNhostConfigured() || !nhostClient) {
    // Fallback to localStorage
    const savedScores = localStorage.getItem("snakeLeaderboard")
    const scores = savedScores ? JSON.parse(savedScores) : []
    const newEntry = {
      id: playerId,
      playerId,
      playerName,
      score,
      timestamp: new Date().toISOString(),
    }
    const filtered = scores.filter((entry: any) => entry.playerId !== playerId || entry.score < score)
    const updated = [...filtered, newEntry].sort((a: any, b: any) => b.score - a.score).slice(0, 10)
    localStorage.setItem("snakeLeaderboard", JSON.stringify(updated))
    return playerId
  }

  try {
    const result = await nhostClient.graphql.request(ADD_SCORE_MUTATION, {
      playerId,
      playerName,
      score,
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    return result.data?.insert_leaderboard_one?.id
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
      timestamp: new Date().toISOString(),
    }
    const filtered = scores.filter((entry: any) => entry.playerId !== playerId || entry.score < score)
    const updated = [...filtered, newEntry].sort((a: any, b: any) => b.score - a.score).slice(0, 10)
    localStorage.setItem("snakeLeaderboard", JSON.stringify(updated))
    return playerId
  }
}

// Get top scores with real-time updates
export const subscribeToLeaderboard = (callback: (scores: LeaderboardEntry[]) => void) => {
  const nhostClient = nhost()
  if (!isNhostConfigured() || !nhostClient) {
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

  try {
    const unsubscribe = nhostClient.graphql.subscribe(
      { query: LEADERBOARD_SUBSCRIPTION },
      {
        next: (result) => {
          if (result.data?.leaderboard) {
            const scores: LeaderboardEntry[] = result.data.leaderboard.map((entry: any) => ({
              id: entry.id,
              playerId: entry.player_id,
              playerName: entry.player_name,
              score: entry.score,
              timestamp: entry.created_at,
            }))
            callback(scores)
          }
        },
        error: (error) => {
          console.error("GraphQL subscription error:", error)
          // Fallback to localStorage
          const savedScores = localStorage.getItem("snakeLeaderboard")
          const scores = savedScores ? JSON.parse(savedScores) : []
          callback(scores)
        },
      },
    )

    return unsubscribe
  } catch (error) {
    console.error("Subscription setup error:", error)
    // Fallback to localStorage
    const savedScores = localStorage.getItem("snakeLeaderboard")
    const scores = savedScores ? JSON.parse(savedScores) : []
    callback(scores)
    return () => {}
  }
}

// Get player's best score
export const getPlayerBestScore = async (playerId: string): Promise<number> => {
  const nhostClient = nhost()
  if (!isNhostConfigured() || !nhostClient) {
    // Fallback to localStorage
    const savedScores = localStorage.getItem("snakeLeaderboard")
    const scores = savedScores ? JSON.parse(savedScores) : []
    const playerScores = scores.filter((entry: any) => entry.playerId === playerId)
    return playerScores.length > 0 ? Math.max(...playerScores.map((s: any) => s.score)) : 0
  }

  try {
    const result = await nhostClient.graphql.request(GET_PLAYER_BEST_SCORE_QUERY, {
      playerId,
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    const scores = result.data?.leaderboard
    return scores && scores.length > 0 ? scores[0].score : 0
  } catch (error) {
    console.error("Error getting player best score:", error)
    // Fallback to localStorage
    const savedScores = localStorage.getItem("snakeLeaderboard")
    const scores = savedScores ? JSON.parse(savedScores) : []
    const playerScores = scores.filter((entry: any) => entry.playerId === playerId)
    return playerScores.length > 0 ? Math.max(...playerScores.map((s: any) => s.score)) : 0
  }
}
