// src/components/bingo/BingoCard.tsx

import React from "react"
import clsx from "clsx"

type BingoCardProps = {
  playerName: string
  card: number[] // 5x5 = 25個、index12は100（FREE）
  calledNumbers: number[]
}

export default function BingoCard({ playerName, card, calledNumbers }: BingoCardProps) {
  return (
    <div className="w-full max-w-xs bg-orange-400 text-white rounded-2xl shadow-lg overflow-hidden border-4 border-blue-900">
      <div className="p-2 bg-gray-100 text-gray-800 font-semibold text-center text-lg rounded-b-xl">
        {playerName}
      </div>

      <div className="text-4xl font-bold text-center py-2">BINGO!</div>

      <div className="grid grid-cols-5 gap-1 p-2 bg-white">
        {card.map((num, index) => {
          const isHit = calledNumbers.includes(num)
          const isFree = num === 100

          return (
            <div
              key={index}
              className={clsx(
                "w-full aspect-square flex items-center justify-center text-xl font-bold rounded-full border border-gray-400",
                isFree
                  ? "bg-lime-400 text-white"
                  : isHit
                  ? "bg-green-500 text-white"
                  : "bg-gray-400 text-white"
              )}
            >
              {isFree ? "FREE" : num}
            </div>
          )
        })}
      </div>
    </div>
  )
}
