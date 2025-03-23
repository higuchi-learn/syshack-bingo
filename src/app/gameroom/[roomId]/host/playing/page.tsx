'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import BingoCard from '@/components/bingo/BingoCard'

type Player = {
  playerName: string
  card: number[][]
  progress: {
    hitCount: number
    reachCount: number
    bingoCount: number
  }
}

export default function HostPlayingPage() {
  const { roomId } = useParams()
  const router = useRouter()

  const [calledNumbers, setCalledNumbers] = useState<number[]>([])
  const [topPlayers, setTopPlayers] = useState<Player[]>([])
  const [bottomPlayers, setBottomPlayers] = useState<Player[]>([])
  const [totalPlayers, setTotalPlayers] = useState<number>(0)
  const [ranking, setRanking] = useState<Player[]>([])
  const [isDrawing, setIsDrawing] = useState(false)

  // 初回GET
  useEffect(() => {
    fetchData()
  }, [roomId])

  const fetchData = async () => {
    const res = await fetch(`/api/gameroom/host/playing?roomId=${roomId}`)
    const data = await res.json()
    if (res.ok && data.success) {
      setCalledNumbers(data.calledNumbers || [])
      setTopPlayers(data.topPlayers || [])
      setBottomPlayers(data.bottomPlayers || [])
      setTotalPlayers(data.totalPlayers || 0)
      setRanking(data.ranking || [])
    } else {
      alert(data.error || '情報取得に失敗しました')
    }
  }

  const handleDraw = async () => {
    if (!roomId || isDrawing) return

    setIsDrawing(true)
    try {
      const res = await fetch(`/api/gameroom/host/playing?roomId=${roomId}`, {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setTimeout(fetchData, 3000)
      } else {
        alert(data.error || '抽選に失敗しました')
      }
    } catch (error) {
      console.error(error)
      alert('通信エラーが発生しました')
    } finally {
      setIsDrawing(false)
    }
  }

  const handleFinish = async () => {
    const ok = confirm('ゲームを終了しますか？')
    if (!ok) return

    try {
      const res = await fetch(`/api/gameroom/status?roomId=${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'finished' }),
      })
      if (res.ok) {
        router.push(`/gameroom/${roomId}/result`)
      } else {
        const data = await res.json()
        alert(data.error || 'ゲーム終了に失敗しました')
      }
    } catch (error) {
      console.error(error)
      alert('通信エラーが発生しました')
    }
  }

  // 重複を除いたプレイヤーを抽出
  const cardPlayers = [...topPlayers, ...bottomPlayers].filter(
    (player, index, self) =>
      self.findIndex((p) => p.playerName === player.playerName) === index
  )

  const paddedCardPlayers = [
    ...cardPlayers,
    ...Array(6 - cardPlayers.length).fill(null),
  ]

  return (
    <main className="p-4 flex flex-col gap-4 text-gray-800">
      <div className="flex justify-end">
        <Button onClick={handleFinish} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2">
          ゲームを終了する
        </Button>
      </div>

      <div className="flex gap-4">
        {/* 左側：情報表示と抽選 */}
        <div className="w-1/2 space-y-4">
          <h2 className="text-xl font-bold">参加者 {totalPlayers}名</h2>

          <div className="bg-gray-100 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-2">TOP 10</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-1">ユーザー</th>
                  <th className="px-1">ヒット</th>
                  <th className="px-1">リーチ</th>
                  <th className="px-1">ビンゴ</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((player, i) => (
                  <tr key={i}>
                    <td className="px-1">{player.playerName}</td>
                    <td className="px-1">{player.progress.hitCount}</td>
                    <td className="px-1">{player.progress.reachCount}</td>
                    <td className="px-1">{player.progress.bingoCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center gap-4">
            <img src="/images/gachagacha.png" alt="抽選器" className="w-40" />
            <Button
              onClick={handleDraw}
              disabled={isDrawing}
              className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold text-xl px-8 py-4 rounded-xl"
            >
              {isDrawing ? "抽選中..." : "抽選"}
            </Button>
          </div>
        </div>

        {/* 右側：ビンゴカード表示 */}
        <div className="w-1/2 grid grid-cols-2 gap-4">
          {paddedCardPlayers.map((player, index) =>
            player ? (
              <BingoCard
                key={index}
                playerName={player.playerName}
                card={player.card.flat()}
                calledNumbers={calledNumbers}
                colorScheme={{
                  hit: "bg-green-500 text-white",
                  free: "bg-lime-400 text-white",
                  default: "bg-gray-300 text-white",
                }}
              />
            ) : (
              <div
                key={index}
                className="w-full aspect-[3/4] bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300"
              />
            )
          )}
        </div>
      </div>
    </main>
  )
}
