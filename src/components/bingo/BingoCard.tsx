import React from "react";
import clsx from "clsx";

type BingoCardProps = {
  playerName: string;
  card: number[]; // 25個, 中央は100（FREE）
  calledNumbers: number[];
  highlightNumber?: number | null;
  onHighlightClick?: () => void;
  colorScheme?: {
    hit: string;
    free: string;
    default: string;
  };
};

export default function BingoCard({
  playerName,
  card,
  calledNumbers,
  highlightNumber = null,
  onHighlightClick,
  colorScheme = {
    hit: "bg-green-500 text-white",
    free: "bg-lime-400 text-white",
    default: "bg-gray-400 text-white",
  },
}: BingoCardProps) {
  if (!card || card.length !== 25) {
    return (
      <div className="w-full max-w-xs text-center text-red-500 font-bold">
        カード情報が無効です
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs bg-orange-400 text-white rounded-2xl shadow-lg overflow-hidden border-4 border-blue-900">
      <div className="p-2 bg-gray-100 text-gray-800 font-semibold text-center text-lg rounded-b-xl">
        {playerName}
      </div>

      <div className="text-4xl font-bold text-center py-2">BINGO!</div>

      <div className="grid grid-cols-5 gap-1 p-2 bg-white">
        {card.map((num, index) => {
          const isFree = num === 100;
          const isHit = calledNumbers.includes(num);
          const isHighlight = Number(highlightNumber) === Number(num);

          const baseClass = isFree
            ? colorScheme.free
            : isHit
            ? colorScheme.hit
            : colorScheme.default;

          return (
            <div
              key={index}
              onClick={isHighlight ? onHighlightClick : undefined}
              className={clsx(
                "w-full aspect-square flex items-center justify-center text-xl font-bold rounded-full border border-gray-400 transition",
                baseClass,
                isHighlight && "animate-pulse ring-4 ring-yellow-300 cursor-pointer"
              )}
            >
              {isFree ? "FREE" : num}
            </div>
          );
        })}
      </div>
    </div>
  );
}
