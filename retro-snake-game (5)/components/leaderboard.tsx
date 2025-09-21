"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { subscribeToLeaderboard, type LeaderboardEntry } from "@/lib/database"
import { useAuth } from "@/components/auth-provider"

export function Leaderboard() {
  const [scores, setScores] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isOffline } = useAuth()

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    try {
      unsubscribe = subscribeToLeaderboard((newScores) => {
        setScores(newScores)
        setLoading(false)
        setError(null)
      })
    } catch (err) {
      console.error("Leaderboard subscription error:", err)
      setError("Connection error")
      setLoading(false)
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  if (loading) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-center font-mono text-primary text-lg sm:text-xl">🏆 LEADERBOARD</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 sm:py-8">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground text-sm">Loading scores...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-center font-mono text-primary text-lg sm:text-xl">🏆 LEADERBOARD</CardTitle>
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            {isOffline ? "📱 OFFLINE" : "🔴 LIVE"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-3 sm:py-4 mb-3 sm:mb-4 bg-muted/50 rounded-lg">
            <p className="text-destructive text-sm">⚠️ {error}</p>
            <p className="text-xs text-muted-foreground">Using local scores</p>
          </div>
        )}

        <div className="space-y-1.5 sm:space-y-2">
          {scores.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
              No scores yet. Be the first to play!
            </p>
          ) : (
            scores.map((entry, index) => (
              <div
                key={entry.id || index}
                className={`flex items-center justify-between p-2 sm:p-3 rounded-lg transition-colors ${
                  entry.playerId === user?.id ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Badge variant={index < 3 ? "default" : "secondary"} className="font-mono text-xs shrink-0">
                    #{index + 1}
                  </Badge>
                  <span
                    className={`text-sm truncate ${
                      entry.playerId === user?.id ? "font-bold text-primary" : "text-foreground"
                    }`}
                  >
                    {entry.playerId === user?.id ? "You" : entry.playerName}
                  </span>
                </div>
                <span className="font-mono font-bold text-accent text-sm sm:text-base shrink-0">{entry.score}</span>
              </div>
            ))
          )}
        </div>

        {user && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              {isOffline ? "Offline Mode" : `Authenticated: ${user.id.slice(0, 8)}...`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
