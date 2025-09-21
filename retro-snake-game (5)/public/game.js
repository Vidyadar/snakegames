class SnakeGame {
  constructor() {
    this.canvas = document.getElementById("game-canvas")
    this.ctx = this.canvas.getContext("2d")
    this.gridSize = 15
    this.tileCount = this.canvas.width / this.gridSize

    this.snake = [{ x: 10, y: 10 }]
    this.food = {}
    this.dx = 0
    this.dy = 0
    this.score = 0
    this.highScore = Number.parseInt(localStorage.getItem("snakeHighScore") || "0")
    this.gameRunning = false
    this.farcasterUser = null

    this.initializeFarcaster()
    this.setupEventListeners()
    this.updateScoreDisplay()
    this.loadLeaderboard()
    this.generateFood()
  }

  async initializeFarcaster() {
    try {
      // Initialize Farcaster SDK
      if (typeof window.farcaster !== "undefined") {
        await window.farcaster.actions.ready()
        this.farcasterUser = await window.farcaster.context.user
        console.log("Farcaster user:", this.farcasterUser)
      }
    } catch (error) {
      console.log("Farcaster SDK not available, running in standalone mode")
    }
  }

  setupEventListeners() {
    // Start button
    document.getElementById("start-btn").addEventListener("click", () => {
      this.startGame()
    })

    // Play again button
    document.getElementById("play-again-btn").addEventListener("click", () => {
      this.startGame()
    })

    // Menu button
    document.getElementById("menu-btn").addEventListener("click", () => {
      this.showMenu()
    })

    // Mobile controls
    document.querySelectorAll(".control-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const direction = e.target.dataset.direction
        this.changeDirection(direction)
      })
    })

    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      if (!this.gameRunning) return

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault()
          this.changeDirection("up")
          break
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault()
          this.changeDirection("down")
          break
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault()
          this.changeDirection("left")
          break
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault()
          this.changeDirection("right")
          break
      }
    })

    // Touch/swipe controls
    let touchStartX = 0
    let touchStartY = 0

    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault()
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    })

    this.canvas.addEventListener("touchend", (e) => {
      e.preventDefault()
      if (!this.gameRunning) return

      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY

      const deltaX = touchEndX - touchStartX
      const deltaY = touchEndY - touchStartY

      const minSwipeDistance = 30

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
          this.changeDirection(deltaX > 0 ? "right" : "left")
        }
      } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
          this.changeDirection(deltaY > 0 ? "down" : "up")
        }
      }
    })
  }

  changeDirection(direction) {
    if (!this.gameRunning) return

    switch (direction) {
      case "up":
        if (this.dy !== 1) {
          this.dx = 0
          this.dy = -1
        }
        break
      case "down":
        if (this.dy !== -1) {
          this.dx = 0
          this.dy = 1
        }
        break
      case "left":
        if (this.dx !== 1) {
          this.dx = -1
          this.dy = 0
        }
        break
      case "right":
        if (this.dx !== -1) {
          this.dx = 1
          this.dy = 0
        }
        break
    }
  }

  startGame() {
    this.snake = [{ x: 10, y: 10 }]
    this.dx = 0
    this.dy = 0
    this.score = 0
    this.gameRunning = true

    this.hideAllScreens()
    this.updateScoreDisplay()
    this.generateFood()
    this.gameLoop()
  }

  gameLoop() {
    if (!this.gameRunning) return

    setTimeout(() => {
      this.clearCanvas()
      this.moveSnake()
      this.drawFood()
      this.drawSnake()

      if (this.checkCollision()) {
        this.gameOver()
        return
      }

      this.gameLoop()
    }, 150)
  }

  clearCanvas() {
    this.ctx.fillStyle = "#000"
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  moveSnake() {
    const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy }
    this.snake.unshift(head)

    // Check if food is eaten
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10
      this.updateScoreDisplay()
      this.generateFood()
    } else {
      this.snake.pop()
    }
  }

  drawSnake() {
    this.ctx.fillStyle = "#00ff00"
    this.snake.forEach((segment, index) => {
      if (index === 0) {
        // Draw head with different color
        this.ctx.fillStyle = "#ffff00"
      } else {
        this.ctx.fillStyle = "#00ff00"
      }
      this.ctx.fillRect(segment.x * this.gridSize, segment.y * this.gridSize, this.gridSize - 2, this.gridSize - 2)
    })
  }

  generateFood() {
    this.food = {
      x: Math.floor(Math.random() * this.tileCount),
      y: Math.floor(Math.random() * this.tileCount),
    }

    // Make sure food doesn't spawn on snake
    if (this.snake.some((segment) => segment.x === this.food.x && segment.y === this.food.y)) {
      this.generateFood()
    }
  }

  drawFood() {
    this.ctx.fillStyle = "#ff0000"
    this.ctx.fillRect(this.food.x * this.gridSize, this.food.y * this.gridSize, this.gridSize - 2, this.gridSize - 2)
  }

  checkCollision() {
    const head = this.snake[0]

    // Wall collision
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      return true
    }

    // Self collision
    for (let i = 1; i < this.snake.length; i++) {
      if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
        return true
      }
    }

    return false
  }

  async gameOver() {
    this.gameRunning = false

    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score
      localStorage.setItem("snakeHighScore", this.highScore.toString())
      document.getElementById("high-score-msg").classList.remove("hidden")
    } else {
      document.getElementById("high-score-msg").classList.add("hidden")
    }

    // Submit score to server
    if (this.score > 0) {
      await this.submitScore()
    }

    // Show game over screen
    document.getElementById("final-score").textContent = this.score
    document.getElementById("game-over").classList.remove("hidden")

    this.updateScoreDisplay()
    this.loadLeaderboard()
  }

  async submitScore() {
    try {
      const fid = this.farcasterUser?.fid || "anonymous"
      const response = await fetch("/api/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score: this.score,
          fid: fid,
        }),
      })

      if (response.ok) {
        console.log("Score submitted successfully")
      }
    } catch (error) {
      console.error("Error submitting score:", error)
    }
  }

  async loadLeaderboard() {
    try {
      const response = await fetch("/api/leaderboard")
      const leaderboard = await response.json()

      const listElement = document.getElementById("leaderboard-list")
      listElement.innerHTML = ""

      leaderboard.forEach((entry, index) => {
        const item = document.createElement("div")
        item.className = "leaderboard-item"
        item.innerHTML = `
                    <span class="rank">#${index + 1}</span>
                    <span class="username">${entry.username}</span>
                    <span class="score">${entry.score}</span>
                `
        listElement.appendChild(item)
      })
    } catch (error) {
      console.error("Error loading leaderboard:", error)
      document.getElementById("leaderboard-list").innerHTML = '<div class="loading">Unable to load leaderboard</div>'
    }
  }

  showMenu() {
    this.gameRunning = false
    this.hideAllScreens()
    document.getElementById("game-menu").classList.remove("hidden")
  }

  hideAllScreens() {
    document.getElementById("game-menu").classList.add("hidden")
    document.getElementById("game-over").classList.add("hidden")
  }

  updateScoreDisplay() {
    document.getElementById("current-score").textContent = this.score
    document.getElementById("high-score").textContent = this.highScore
  }
}

// Initialize game when page loads
document.addEventListener("DOMContentLoaded", () => {
  new SnakeGame()
})
