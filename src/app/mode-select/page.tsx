// src/app/mode-select/page.tsx
'use client'

import { useRouter } from 'next/navigation'

export default function ModeSelectPage() {
  const router = useRouter()

  const modes = [
    {
      title: "スピードビンゴで遊ぶ",
      description: "３×３のビンゴカードで遊びます。短時間でゲームを終了させたい方にオススメです。",
      imageAlt: "イラストもしくは写真",
      path: "/customs-select/speed",
    },
    {
      title: "普通のビンゴで遊ぶ",
      description: "一般的なビンゴのルールです。報酬獲得までのビンゴライン数は設定することができます。",
      imageAlt: "",
      path: "/customs-select/normal",
    },
    {
      title: "カスタムビンゴで遊ぶ",
      description: "抽選される番号の確率を操作するなどの、当サービス独自のゲームルールが適用されたビンゴです。",
      imageAlt: "",
      path: "/customs-select/custom",
    }
  ]

  return (
    <main className="min-h-screen px-4 py-10 bg-white">
      <h1 className="text-3xl font-bold border-b pb-4 mb-8">ゲームモードを選択</h1>
      <div className="space-y-6">
        {modes.map((mode, index) => (
          <div
            key={index}
            onClick={() => router.push(mode.path)}
            className="cursor-pointer bg-gray-100 rounded-lg flex items-center justify-between p-6 hover:bg-gray-200 transition"
          >
            <div>
              <h2 className="text-xl font-semibold mb-2">{mode.title}</h2>
              <p className="text-gray-700 text-sm">{mode.description}</p>
            </div>
            <div className="w-32 h-20 bg-gray-300 rounded-md flex items-center justify-center text-xs text-gray-600">
              {mode.imageAlt || "イラスト\nもしくは\n写真"}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
