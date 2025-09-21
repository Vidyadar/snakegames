"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Trophy } from "lucide-react"
import { getPlayerNFTs } from "@/lib/nft-minting"
import { useAuth } from "@/components/auth-provider"

export function NFTGallery() {
  const [nfts, setNfts] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const playerNFTs = getPlayerNFTs(user.uid)
      setNfts(playerNFTs)
    }
  }, [user])

  if (nfts.length === 0) {
    return null
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" size="sm" className="fixed top-4 right-4 font-mono">
        <Trophy className="w-4 h-4 mr-2" />
        My NFTs ({nfts.length})
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-center font-mono text-primary">🏆 Your NFT Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {nfts.map((nft, index) => (
                  <Card key={index} className="p-4 bg-muted/50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-foreground">{nft.metadata.name}</h3>
                        <p className="text-sm text-muted-foreground">Token #{nft.tokenId}</p>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        ${nft.fee.toFixed(2)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      {nft.metadata.attributes.map((attr: any, i: number) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-muted-foreground">{attr.trait_type}:</span>
                          <span className="font-mono">{attr.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-muted-foreground">{nft.transactionHash.slice(0, 10)}...</span>
                      <Button size="sm" variant="ghost" className="h-4 w-4 p-0">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <Button onClick={() => setIsOpen(false)} className="w-full mt-4 font-mono">
                Close Gallery
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
