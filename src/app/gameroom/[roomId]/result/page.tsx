'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import BingoCard from '@/components/bingo/BingoCard'

type Player = {
  id: string
  playerName: string
  progress: {
    point: number
    hitCount: number
    reachCount: number
    bingoCount: number
    reachDrawCount: number | null
    bingoDrawCount: number | null
    wonDrawCount: number | null
  }
  meta: {
    won?: boolean
  }
}

export default function GameResultPage() {
  const { roomId } = useParams()
  const [players, setPlayers] = useState<Player[]>([])
  const [calledNumbers, setCalledNumbers] = useState<number[]>([])
  const [lowestCard, setLowestCard] = useState<number[]>([])

  useEffect(() => {
    if (!roomId) return
    fetch(`/api/gameroom/result?roomId=${roomId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPlayers(data.players)
          setCalledNumbers(data.calledNumbers)
          setLowestCard(data.lowestCard)
        }
      })
      .catch((err) => console.error(err))
  }, [roomId])

  const renderCount = (n: number | null | undefined) =>
    n === null || n === undefined ? '-' : `${n}回目`

  return (
    <main className="p-4 flex flex-col lg:flex-row gap-4">
      {/* ランキング表 */}
      <Card className="w-full lg:w-2/3">
        <CardContent className="p-4">
          <h2 className="text-xl font-bold mb-2">最終ランキング</h2>
          <ScrollArea className="max-h-[70vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>順位</TableHead>
                  <TableHead>プレイヤー名</TableHead>
                  <TableHead>報酬</TableHead>
                  <TableHead>初ビンゴ</TableHead>
                  <TableHead>初リーチ</TableHead>
                  <TableHead>ビンゴ数</TableHead>
                  <TableHead>リーチ数</TableHead>
                  <TableHead>ヒット数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player, index) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-bold">#{index + 1}</TableCell>
                    <TableCell>{player.playerName}</TableCell>
                    <TableCell>
                      {player.meta?.won ? '🏆' : '-'}
                    </TableCell>
                    <TableCell>{renderCount(player.progress?.bingoDrawCount)}</TableCell>
                    <TableCell>{renderCount(player.progress?.reachDrawCount)}</TableCell>
                    <TableCell>{player.progress?.bingoCount ?? 0}</TableCell>
                    <TableCell>{player.progress?.reachCount ?? 0}</TableCell>
                    <TableCell>{player.progress?.hitCount ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 最下位のビンゴカード（PCのみ表示） */}
      <div className="hidden lg:block w-full lg:w-1/3">
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="text-xl font-bold">最下位プレイヤーのカード</h2>
            {lowestCard.length === 25 ? (
              <BingoCard
                playerName=""
                card={lowestCard}
                calledNumbers={calledNumbers}
                colorScheme={{
                  hit: 'bg-red-500 text-white',
                  free: 'bg-gray-400 text-white',
                  default: 'bg-gray-200 text-gray-700',
                }}
              />
            ) : (
              <p className="text-sm text-gray-500">カード情報がありません</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
