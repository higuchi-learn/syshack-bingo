'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import clsx from "clsx"

export default function PlayerSignInPage() {
  const [playerName, setPlayerName] = useState("")
  const [playerList, setPlayerList] = useState<string[]>([])
  const [roomName, setRoomName] = useState("")
  const [error, setError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const { roomId } = useParams()

  useEffect(() => {
    const fetchRoom = async () => {
      const res = await fetch(`/api/gameroom/player/sign-in?roomId=${roomId}`)
      const data = await res.json()
      if (res.ok && data.success) {
        setRoomName(data.roomName)
        setPlayerList(data.players)
      } else {
        alert(data.error || "ルーム取得に失敗しました")
      }
    }

    if (roomId) fetchRoom()
  }, [roomId])

  useEffect(() => {
    setError(playerList.includes(playerName.trim()))
  }, [playerName, playerList])

  const handleJoin = async () => {
    if (!playerName.trim() || error) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/gameroom/player/sign-in?roomId=${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        router.push(`/gameroom/${roomId}/player/waiting`)
      } else {
        alert(data.error || "登録に失敗しました")
      }
    } catch (err) {
      console.error(err)
      alert("通信エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-6 bg-gradient-to-b from-blue-800 to-blue-900 text-white">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">{roomName}</h1>

        <div>
          <label className="block font-semibold mb-2 text-white text-lg">プレイヤー名</label>
          <Input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="プレイヤー名を入力してください"
            className={clsx(
              "bg-white text-gray-800 font-medium placeholder:text-gray-400",
              error && "border-2 border-red-500"
            )}
          />
          {error && (
            <p className="text-red-400 mt-1 text-sm">その名前はすでに使われています</p>
          )}
        </div>

        <Button
          onClick={handleJoin}
          disabled={!playerName.trim() || error || isLoading}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold text-2xl py-6 rounded-xl disabled:opacity-50"
        >
          {isLoading ? "登録中..." : "参加"}
        </Button>
      </div>
    </main>
  )
}
