'use client'

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  const handleClick = () => {
    router.push("/mode-select")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">シン・ビンゴ</h1>
      <Button onClick={handleClick} className="text-lg px-6 py-3">
        ビンゴ会場を作成
      </Button>
    </main>
  )
}
