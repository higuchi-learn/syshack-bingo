'use client'

import { useParams } from "next/navigation"

export default function PlayerWaitingPage() {
  const { roomId } = useParams()

  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-6 bg-gradient-to-b from-indigo-800 to-indigo-900 text-white text-center">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">参加が完了しました！</h1>
        <p className="text-lg">ルームID: <span className="font-mono text-yellow-300">{roomId}</span></p>
        <p className="text-sm text-gray-300">ゲームが開始されるまで、このままお待ちください…</p>
      </div>
    </main>
  )
}
