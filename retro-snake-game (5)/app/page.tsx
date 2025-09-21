"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SnakeGame } from "@/components/snake-game"
import { Leaderboard } from "@/components/leaderboard"
import { GameOverModal } from "@/components/game-over-modal"
import { NFTGallery } from "@/components/nft-gallery"
import { addScore, getPlayerBestScore } from "@/lib/database"
import { useAuth } from "@/components/auth-provider"

export default function HomePage() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver">("menu")
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const { user, displayName, loading } = useAuth()

  useEffect(() => {
    const loadHighScore = async () => {
      if (!user) return

      try {
        const nhostHighScore = await getPlayerBestScore(user.id)
        const localHighScore = Number.parseInt(localStorage.getItem("snakeHighScore") || "0")
        const bestScore = Math.max(nhostHighScore, localHighScore)
        setHighScore(bestScore)
      } catch (error) {
        console.error("Error loading high score:", error)
        const savedHighScore = localStorage.getItem("snakeHighScore")
        if (savedHighScore) {
          setHighScore(Number.parseInt(savedHighScore))
        }
      }
    }

    if (user) {
      loadHighScore()
    }
  }, [user])

  const startGame = () => {
    setGameState("playing")
    setScore(0)
  }

  const endGame = async (finalScore: number) => {
    setScore(finalScore)
    setGameState("gameOver")

    if (finalScore > highScore) {
      setHighScore(finalScore)
      localStorage.setItem("snakeHighScore", finalScore.toString())
    }

    if (finalScore > 0 && user) {
      try {
        await addScore(user.id, displayName, finalScore)
      } catch (error) {
        console.error("Error saving score to Nhost:", error)
        const savedScores = localStorage.getItem("snakeLeaderboard")
        const scores = savedScores ? JSON.parse(savedScores) : []
        const newEntry = {
          id: user.id,
          score: finalScore,
          playerName: displayName,
          timestamp: Date.now(),
        }
        const filtered = scores.filter((entry: any) => entry.id !== user.id)
        const updated = [...filtered, newEntry].sort((a: any, b: any) => b.score - a.score).slice(0, 10)
        localStorage.setItem("snakeLeaderboard", JSON.stringify(updated))
      }
    }
  }

  const resetGame = () => {
    setGameState("menu")
    setScore(0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing game...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-2 sm:p-4">
      <div className="fixed top-4 right-4 z-10">
        <NFTGallery />
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-4xl sm:text-6xl font-bold text-primary mb-2 font-mono tracking-wider">SNAKE</h1>
          <p className="text-muted-foreground text-sm sm:text-lg">Classic arcade game with modern features</p>
          {displayName && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Playing as: <span className="text-primary font-mono">{displayName}</span>
            </p>
          )}
        </div>

        <div className="flex justify-center gap-4 sm:gap-8 mb-4 sm:mb-6">
          <Card className="px-3 py-2 sm:px-6 sm:py-3">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">SCORE</p>
              <p className="text-lg sm:text-2xl font-bold text-accent font-mono">{score}</p>
            </div>
          </Card>
          <Card className="px-3 py-2 sm:px-6 sm:py-3">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">HIGH SCORE</p>
              <p className="text-lg sm:text-2xl font-bold text-primary font-mono">{highScore}</p>
            </div>
          </Card>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 justify-center items-start">
          <div className="flex flex-col items-center order-2 lg:order-1">
            {gameState === "menu" && (
              <Card className="w-full max-w-sm sm:w-96 h-80 sm:h-96 flex flex-col items-center justify-center gap-4 p-4">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">Ready to Play?</h2>
                <p className="text-muted-foreground text-center text-sm sm:text-base px-2">
                  <span className="hidden sm:inline">Use arrow keys or WASD to control the snake</span>
                  <span className="sm:hidden">Swipe or tap buttons to control the snake</span>
                </p>
                <Button onClick={startGame} size="lg" className="font-mono">
                  START GAME
                </Button>
              </Card>
            )}

            {gameState === "playing" && <SnakeGame onGameOver={endGame} onScoreUpdate={setScore} />}

            {gameState === "gameOver" && (
              <Card className="w-full max-w-sm sm:w-96 h-80 sm:h-96 flex flex-col items-center justify-center gap-4 p-4">
                <h2 className="text-xl sm:text-2xl font-bold text-accent text-center">Game Over!</h2>
                <p className="text-base sm:text-lg text-foreground">Final Score: {score}</p>
                {score === highScore && score > 0 && (
                  <p className="text-primary font-bold text-sm sm:text-base text-center">New High Score! 🎉</p>
                )}
                <div className="flex gap-2">
                  <Button onClick={startGame} className="font-mono text-sm">
                    PLAY AGAIN
                  </Button>
                  <Button onClick={resetGame} variant="outline" className="font-mono bg-transparent text-sm">
                    MENU
                  </Button>
                </div>
              </Card>
            )}
          </div>

          <div className="w-full max-w-sm lg:w-80 order-1 lg:order-2">
            <Leaderboard />
          </div>
        </div>

        <div className="text-center mt-4 sm:mt-8 text-xs sm:text-sm text-muted-foreground px-4">
          <p className="hidden sm:block">Use ↑↓←→ arrow keys or WASD to move • Eat food to grow and score points</p>
          <p className="sm:hidden">Swipe on game area or tap direction buttons • Eat food to grow and score points</p>
        </div>
      </div>

      {gameState === "gameOver" && score > 0 && user && (
        <GameOverModal
          score={score}
          isHighScore={score === highScore}
          onClose={() => setGameState("menu")}
          playerId={user.id}
          playerName={displayName}
        />
      )}
    </div>
  )
}
