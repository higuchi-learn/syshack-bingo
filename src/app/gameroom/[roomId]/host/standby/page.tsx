'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, onSnapshot, collection, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../../../../../../firebase/init"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"

export default function StandbyPage() {
  const { roomId } = useParams()
  const router = useRouter()
  const [roomName, setRoomName] = useState("")
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([])

  // Firestore: ルーム情報取得（roomName）
  useEffect(() => {
    if (!roomId) return
    const fetchRoomName = async () => {
      const roomRef = doc(db, "gameRooms", String(roomId))
      const snap = await getDoc(roomRef)
      if (snap.exists()) {
        const data = snap.data()
        setRoomName(data.roomName || "")
      }
    }
    fetchRoomName()
  }, [roomId])

  // Firestore: playersのサブコレクションをonSnapshotで監視
  useEffect(() => {
    if (!roomId) return

    const playersRef = collection(db, "gameRooms", String(roomId), "players")

    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      const newPlayers = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().playerName || "名無し",
      }))
      setPlayers(newPlayers)
    })

    return () => unsubscribe()
  }, [roomId])

  // ゲーム開始処理
  const handleStart = async () => {
    const roomRef = doc(db, "gameRooms", String(roomId))
    await updateDoc(roomRef, { status: "playing" })
    router.push(`/gameroom/${roomId}/host/playing`)
  }

  return (
    <main className="min-h-screen p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        {/* 左：room名とQR */}
        <div>
          <h1 className="text-3xl font-bold mb-4">{roomName}</h1>
          <QRCodeSVG
            value={`${process.env.NEXT_PUBLIC_BASE_URL}/gameroom/${roomId}/player/sign-in`}
            size={256}
          />
        </div>

        {/* 右：参加者 */}
        <div>
          <h2 className="text-xl font-bold mb-4">参加者：{players.length}名</h2>
          <ul className="bg-gray-100 p-4 rounded max-h-[320px] overflow-y-auto">
            {players.map((p) => (
              <li key={p.id} className="mb-2">{p.name}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* ゲーム開始ボタン */}
      <div className="flex justify-end mt-10">
        <Button
          onClick={handleStart}
          className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-6 py-2 rounded"
        >
          ゲーム開始
        </Button>
      </div>
    </main>
  )
}
