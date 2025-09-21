const express = require("express")
const path = require("path")
const app = express()
const PORT = process.env.PORT || 3000

console.log("[v0] Starting Farcaster Snake Mini App server...")
console.log("[v0] Port:", PORT)
console.log("[v0] Static files directory:", path.join(__dirname, "public"))

// Serve static files with logging
app.use((req, res, next) => {
  console.log("[v0] Request:", req.method, req.path)
  next()
})

app.use(express.static("public"))
app.use(express.json())

app.get("/.well-known/farcaster.json", (req, res) => {
  console.log("[v0] Serving Farcaster manifest")
  res.json({
    accountAssociation: {
      header: "eyJmaWQiOjEsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg0ODY5NGE2NzJkNjc2YzY5NjI2NTc3Mjc0NzkyZTY1NzQ2OCJ9",
      payload: "eyJkb21haW4iOiJ5b3VyLWRvbWFpbi5jb20ifQ",
      signature: "MHg...",
    },
  })
})

// Main route with debugging
app.get("/", (req, res) => {
  console.log("[v0] Serving main page")
  const indexPath = path.join(__dirname, "public", "index.html")
  console.log("[v0] Index file path:", indexPath)
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("[v0] Error serving index.html:", err)
      res.status(500).send("Error loading page")
    }
  })
})

app.get("/api/miniapp-config", (req, res) => {
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`
  console.log("[v0] Base URL:", baseUrl)

  res.json({
    version: "1",
    imageUrl: `${baseUrl}/snake-preview.jpg`,
    button: {
      title: "Play Snake",
      action: {
        type: "launch_frame",
        url: baseUrl,
        name: "Retro Snake",
        splashImageUrl: `${baseUrl}/snake-splash.jpg`,
        splashBackgroundColor: "#000000",
      },
    },
  })
})

// API endpoint for scores (simplified for demo)
app.post("/api/score", (req, res) => {
  const { score, fid } = req.body
  // In a real app, you'd save this to a database
  console.log(`Player ${fid} scored ${score}`)
  res.json({ success: true, score })
})

app.get("/api/leaderboard", (req, res) => {
  // Mock leaderboard data
  const leaderboard = [
    { fid: "12345", username: "player1", score: 150 },
    { fid: "67890", username: "player2", score: 120 },
    { fid: "11111", username: "player3", score: 100 },
  ]
  res.json(leaderboard)
})

app.get("*", (req, res) => {
  console.log("[v0] Catch-all route for:", req.path)
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ error: "API endpoint not found" })
  } else {
    res.sendFile(path.join(__dirname, "public", "index.html"), (err) => {
      if (err) {
        console.error("[v0] Error in catch-all route:", err)
        res.status(404).send("Page not found")
      }
    })
  }
})

app.use((err, req, res, next) => {
  console.error("[v0] Server error:", err)
  res.status(500).json({ error: "Internal server error", details: err.message })
})

app.listen(PORT, () => {
  console.log(`[v0] Farcaster Snake Mini App running on port ${PORT}`)
  console.log(`[v0] Access at: http://localhost:${PORT}`)
})
