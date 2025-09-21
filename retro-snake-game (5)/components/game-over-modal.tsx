"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ExternalLink, Copy, CheckCircle, XCircle } from "lucide-react"
import { generateNFTMetadata, mintScoreNFT, calculateMintingFee, type MintingResult } from "@/lib/nft-minting"

interface GameOverModalProps {
  score: number
  isHighScore: boolean
  onClose: () => void
  playerId: string
  playerName: string
}

export function GameOverModal({ score, isHighScore, onClose, playerId, playerName }: GameOverModalProps) {
  const [isMinting, setIsMinting] = useState(false)
  const [mintProgress, setMintProgress] = useState(0)
  const [mintResult, setMintResult] = useState<MintingResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const mintingFee = calculateMintingFee(score)
  const developerShare = mintingFee * 0.5 // 50% to developer
  const minimumScore = 50

  const handleMintNFT = async () => {
    if (score < minimumScore) {
      return
    }

    setIsMinting(true)
    setMintProgress(0)

    // Generate NFT metadata
    const metadata = generateNFTMetadata(score, playerName, playerId, Date.now())

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setMintProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 300)

    try {
      // Attempt to mint the NFT
      const result = await mintScoreNFT(metadata, playerId, mintingFee)

      clearInterval(progressInterval)
      setMintProgress(100)
      setMintResult(result)
      setIsMinting(false)
    } catch (error) {
      clearInterval(progressInterval)
      setMintResult({
        success: false,
        error: "Minting failed. Please try again.",
      })
      setIsMinting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const previewMetadata = generateNFTMetadata(score, playerName, playerId, Date.now())

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center font-mono text-primary text-lg sm:text-xl">🎮 Game Complete!</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-accent font-mono mb-2">{score} Points</div>
            {isHighScore && (
              <Badge className="bg-primary text-primary-foreground text-xs sm:text-sm">🏆 New High Score!</Badge>
            )}
          </div>

          {!mintResult && !isMinting && (
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-card p-3 sm:p-4 rounded-lg border">
                <h3 className="font-bold text-foreground mb-2 text-sm sm:text-base">Mint Your Score as NFT</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  Immortalize your achievement on the blockchain! Your score will be minted as a unique NFT.
                </p>

                <div className="space-y-1.5 sm:space-y-2 text-xs mb-3 sm:mb-4">
                  <div className="flex justify-between">
                    <span>Minting Fee:</span>
                    <span className="font-mono">${mintingFee.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Developer Share (50%):</span>
                    <span className="font-mono">${developerShare.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Fee:</span>
                    <span className="font-mono">${(mintingFee - developerShare).toFixed(2)} USD</span>
                  </div>
                </div>

                <Button
                  onClick={() => setShowPreview(!showPreview)}
                  variant="outline"
                  size="sm"
                  className="w-full mb-3 text-xs sm:text-sm"
                >
                  {showPreview ? "Hide" : "Preview"} NFT Metadata
                </Button>

                {showPreview && (
                  <Card className="p-2 sm:p-3 bg-muted/50 text-xs space-y-1.5 sm:space-y-2">
                    <div>
                      <strong>Name:</strong> {previewMetadata.name}
                    </div>
                    <div>
                      <strong>Description:</strong> {previewMetadata.description}
                    </div>
                    <div>
                      <strong>Attributes:</strong>
                    </div>
                    <ul className="ml-3 sm:ml-4 space-y-1">
                      {previewMetadata.attributes.map((attr, i) => (
                        <li key={i}>
                          • {attr.trait_type}: {attr.value}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleMintNFT}
                  className="flex-1 font-mono text-xs sm:text-sm"
                  disabled={score < minimumScore}
                >
                  {score < minimumScore ? `Need ${minimumScore}+ points` : `Mint NFT ($${mintingFee.toFixed(2)})`}
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 font-mono bg-transparent text-xs sm:text-sm"
                >
                  Skip
                </Button>
              </div>

              {score < minimumScore && (
                <p className="text-xs text-muted-foreground text-center">
                  Minimum score of {minimumScore} required for NFT minting
                </p>
              )}
            </div>
          )}

          {isMinting && (
            <div className="space-y-3 sm:space-y-4">
              <div className="text-center">
                <h3 className="font-bold text-foreground mb-2 text-sm sm:text-base">Minting NFT...</h3>
                <div className="space-y-2">
                  <Progress value={mintProgress} className="w-full" />
                  <p className="text-xs sm:text-sm text-muted-foreground">{Math.round(mintProgress)}% Complete</p>
                </div>
                <div className="mt-3 sm:mt-4 text-xs text-muted-foreground space-y-1">
                  <p>• Generating metadata...</p>
                  <p>• Uploading to IPFS...</p>
                  <p>• Broadcasting transaction...</p>
                  <p>• Waiting for confirmation...</p>
                </div>
              </div>
            </div>
          )}

          {mintResult && (
            <div className="space-y-3 sm:space-y-4 text-center">
              {mintResult.success ? (
                <div className="text-green-600">
                  <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2" />
                  <h3 className="font-bold text-foreground text-sm sm:text-base">NFT Minted Successfully!</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2 mb-3 sm:mb-4">
                    Your Snake score of {score} has been minted as NFT #{mintResult.tokenId}
                  </p>

                  <Card className="p-2 sm:p-3 bg-muted/50 text-left text-xs space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Token ID:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono">#{mintResult.tokenId}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0"
                          onClick={() => copyToClipboard(mintResult.tokenId!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Transaction:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono">{mintResult.transactionHash?.slice(0, 8)}...</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0"
                          onClick={() => copyToClipboard(mintResult.transactionHash!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-4 w-4 p-0">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="text-red-600">
                  <XCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2" />
                  <h3 className="font-bold text-foreground text-sm sm:text-base">Minting Failed</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    {mintResult.error || "An error occurred during minting."}
                  </p>
                  <Button
                    onClick={() => {
                      setMintResult(null)
                      setMintProgress(0)
                    }}
                    variant="outline"
                    className="mt-3 text-xs sm:text-sm"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              <Button onClick={onClose} className="w-full font-mono text-xs sm:text-sm">
                Continue Playing
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
