"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

interface Position {
  x: number
  y: number
}

interface SnakeGameProps {
  onGameOver: (score: number) => void
  onScoreUpdate: (score: number) => void
}

const GRID_SIZE = 20
const INITIAL_SNAKE = [{ x: 10, y: 10 }]
const INITIAL_FOOD = { x: 15, y: 15 }
const INITIAL_DIRECTION = { x: 0, y: -1 }

export function SnakeGame({ onGameOver, onScoreUpdate }: SnakeGameProps) {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE)
  const [food, setFood] = useState<Position>(INITIAL_FOOD)
  const [direction, setDirection] = useState<Position>(INITIAL_DIRECTION)
  const [gameRunning, setGameRunning] = useState(true)
  const [score, setScore] = useState(0)

  const gameLoopRef = useRef<NodeJS.Timeout>()
  const directionRef = useRef(direction)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  // Generate random food position
  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
    } while (currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [])

  // Check collision
  const checkCollision = useCallback((head: Position, body: Position[]): boolean => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true
    }
    // Self collision
    return body.some((segment) => segment.x === head.x && segment.y === head.y)
  }, [])

  // Game loop
  const gameLoop = useCallback(() => {
    setSnake((currentSnake) => {
      if (!gameRunning) return currentSnake

      const newSnake = [...currentSnake]
      const head = { ...newSnake[0] }

      // Move head
      head.x += directionRef.current.x
      head.y += directionRef.current.y

      // Check collision
      if (checkCollision(head, newSnake)) {
        setGameRunning(false)
        return currentSnake
      }

      newSnake.unshift(head)

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 10
        setScore(newScore)
        onScoreUpdate(newScore)
        setFood(generateFood(newSnake))
      } else {
        newSnake.pop()
      }

      return newSnake
    })
  }, [food, score, gameRunning, checkCollision, generateFood, onScoreUpdate])

  const changeDirection = useCallback(
    (newDirection: Position) => {
      if (!gameRunning) return

      // Prevent reverse direction
      if (
        (newDirection.x === 1 && directionRef.current.x === -1) ||
        (newDirection.x === -1 && directionRef.current.x === 1) ||
        (newDirection.y === 1 && directionRef.current.y === -1) ||
        (newDirection.y === -1 && directionRef.current.y === 1)
      ) {
        return
      }

      directionRef.current = newDirection
      setDirection(newDirection)
    },
    [gameRunning],
  )

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!gameRunning) return

      const { key } = e

      switch (key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (directionRef.current.y === 0) changeDirection({ x: 0, y: -1 })
          break
        case "ArrowDown":
        case "s":
        case "S":
          if (directionRef.current.y === 0) changeDirection({ x: 0, y: 1 })
          break
        case "ArrowLeft":
        case "a":
        case "A":
          if (directionRef.current.x === 0) changeDirection({ x: -1, y: 0 })
          break
        case "ArrowRight":
        case "d":
        case "D":
          if (directionRef.current.x === 0) changeDirection({ x: 1, y: 0 })
          break
      }
    },
    [gameRunning, changeDirection],
  )

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current || !gameRunning) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y
      const minSwipeDistance = 30

      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) {
            changeDirection({ x: 1, y: 0 }) // Right
          } else {
            changeDirection({ x: -1, y: 0 }) // Left
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0) {
            changeDirection({ x: 0, y: 1 }) // Down
          } else {
            changeDirection({ x: 0, y: -1 }) // Up
          }
        }
      }

      touchStartRef.current = null
    },
    [gameRunning, changeDirection],
  )

  // Setup game loop and event listeners
  useEffect(() => {
    if (gameRunning) {
      gameLoopRef.current = setInterval(gameLoop, 150)
      window.addEventListener("keydown", handleKeyPress)
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
      window.removeEventListener("keydown", handleKeyPress)
      onGameOver(score)
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [gameRunning, gameLoop, handleKeyPress, onGameOver, score])

  // Update direction ref when direction changes
  useEffect(() => {
    directionRef.current = direction
  }, [direction])

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="p-2 sm:p-4">
        <div
          ref={gameAreaRef}
          className="grid gap-0 border-2 border-border bg-card touch-none select-none"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            width: "min(400px, 90vw)",
            height: "min(400px, 90vw)",
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
            const x = index % GRID_SIZE
            const y = Math.floor(index / GRID_SIZE)

            const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y
            const isSnakeBody = snake.slice(1).some((segment) => segment.x === x && segment.y === y)
            const isFood = food.x === x && food.y === y

            return (
              <div
                key={index}
                className={`
                  border border-muted/20
                  ${isSnakeHead ? "bg-primary" : ""}
                  ${isSnakeBody ? "bg-primary/80" : ""}
                  ${isFood ? "bg-accent rounded-full" : ""}
                  ${!isSnakeHead && !isSnakeBody && !isFood ? "bg-card" : ""}
                `}
              />
            )
          })}
        </div>
      </Card>

      <div className="flex flex-col items-center gap-2 sm:hidden">
        <Button
          variant="outline"
          size="sm"
          className="w-12 h-12 p-0 bg-transparent"
          onTouchStart={(e) => {
            e.preventDefault()
            changeDirection({ x: 0, y: -1 })
          }}
          onClick={() => changeDirection({ x: 0, y: -1 })}
        >
          <ChevronUp className="w-6 h-6" />
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-12 h-12 p-0 bg-transparent"
            onTouchStart={(e) => {
              e.preventDefault()
              changeDirection({ x: -1, y: 0 })
            }}
            onClick={() => changeDirection({ x: -1, y: 0 })}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-12 h-12 p-0 bg-transparent"
            onTouchStart={(e) => {
              e.preventDefault()
              changeDirection({ x: 1, y: 0 })
            }}
            onClick={() => changeDirection({ x: 1, y: 0 })}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-12 h-12 p-0 bg-transparent"
          onTouchStart={(e) => {
            e.preventDefault()
            changeDirection({ x: 0, y: 1 })
          }}
          onClick={() => changeDirection({ x: 0, y: 1 })}
        >
          <ChevronDown className="w-6 h-6" />
        </Button>
      </div>

      <div className="text-center text-xs text-muted-foreground max-w-xs">
        <p className="hidden sm:block">Use arrow keys or WASD to move</p>
        <p className="sm:hidden">Swipe or tap buttons to move</p>
      </div>
    </div>
  )
}
