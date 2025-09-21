// NFT Minting utilities for Snake game scores
export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
}

export interface MintingResult {
  success: boolean
  transactionHash?: string
  tokenId?: string
  error?: string
}

// Generate NFT metadata for a score
export const generateNFTMetadata = (
  score: number,
  playerName: string,
  playerId: string,
  timestamp: number,
): NFTMetadata => {
  const date = new Date(timestamp).toLocaleDateString()

  return {
    name: `Snake Score: ${score}`,
    description: `A high score of ${score} points achieved by ${playerName} in the Retro Snake Game on ${date}. This NFT represents a permanent record of gaming achievement on the blockchain.`,
    image: generateScoreImage(score, playerName),
    attributes: [
      {
        trait_type: "Score",
        value: score,
      },
      {
        trait_type: "Player",
        value: playerName,
      },
      {
        trait_type: "Date",
        value: date,
      },
      {
        trait_type: "Game",
        value: "Retro Snake",
      },
      {
        trait_type: "Rarity",
        value: getScoreRarity(score),
      },
    ],
  }
}

// Generate a data URL image for the score
const generateScoreImage = (score: number, playerName: string): string => {
  // Create a simple SVG image representing the score
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .title { font: bold 24px monospace; fill: #a16207; }
          .score { font: bold 48px monospace; fill: #dc2626; }
          .player { font: 16px monospace; fill: #4b5563; }
          .game { font: 14px monospace; fill: #4b5563; }
        </style>
      </defs>
      <rect width="400" height="400" fill="#fefce8" stroke="#a16207" stroke-width="4"/>
      <text x="200" y="80" text-anchor="middle" class="title">SNAKE SCORE NFT</text>
      <text x="200" y="160" text-anchor="middle" class="score">${score}</text>
      <text x="200" y="220" text-anchor="middle" class="player">by ${playerName}</text>
      <text x="200" y="280" text-anchor="middle" class="game">Retro Snake Game</text>
      <rect x="50" y="320" width="300" height="20" fill="#a16207" rx="10"/>
      <text x="200" y="365" text-anchor="middle" class="game">Blockchain Achievement</text>
    </svg>
  `

  return `data:image/svg+xml;base64,${btoa(svg)}`
}

// Determine score rarity
const getScoreRarity = (score: number): string => {
  if (score >= 500) return "Legendary"
  if (score >= 300) return "Epic"
  if (score >= 200) return "Rare"
  if (score >= 100) return "Uncommon"
  return "Common"
}

// Calculate minting fee based on score (capped at $2.00)
export const calculateMintingFee = (score: number): number => {
  const baseFee = 0.5 // $0.50 base fee
  const scoreFee = score * 0.005 // $0.005 per point
  return Math.min(baseFee + scoreFee, 2.0) // Cap at $2.00
}

// Mock blockchain minting function
export const mintScoreNFT = async (metadata: NFTMetadata, playerId: string, fee: number): Promise<MintingResult> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000))

  // Simulate occasional failures (10% chance)
  if (Math.random() < 0.1) {
    return {
      success: false,
      error: "Network congestion. Please try again.",
    }
  }

  // Generate mock transaction data
  const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`
  const tokenId = Math.floor(Math.random() * 10000).toString()

  // Store minted NFT record locally
  const mintedNFTs = JSON.parse(localStorage.getItem("mintedNFTs") || "[]")
  mintedNFTs.push({
    tokenId,
    transactionHash,
    metadata,
    playerId,
    fee,
    timestamp: Date.now(),
  })
  localStorage.setItem("mintedNFTs", JSON.stringify(mintedNFTs))

  return {
    success: true,
    transactionHash,
    tokenId,
  }
}

// Get player's minted NFTs
export const getPlayerNFTs = (playerId: string) => {
  const mintedNFTs = JSON.parse(localStorage.getItem("mintedNFTs") || "[]")
  return mintedNFTs.filter((nft: any) => nft.playerId === playerId)
}
