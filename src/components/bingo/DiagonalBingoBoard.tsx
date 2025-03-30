import React from "react";

interface DiagonalBingoBoardProps {
  scale?: number; // 倍率指定（1.0が標準サイズ）
}

export default function DiagonalBingoBoard({ scale = 1.0 }: DiagonalBingoBoardProps) {
  const size = 5;
  const baseCircleSize = 24;
  const baseGap = 8;
  const baseStrokeWidth = 5;
  const baseBoardSize = size * baseCircleSize + (size - 1) * baseGap;

  const isOrange = (row: number, col: number) => {
    return row === col;
  };

  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: `${baseBoardSize}px`, height: `${baseBoardSize}px` }}>
      <div
        className="relative grid grid-cols-5 grid-rows-5"
        style={{ gap: `${baseGap}px`, width: `${baseBoardSize}px`, height: `${baseBoardSize}px` }}
      >
        {[...Array(size * size)].map((_, i) => {
          const row = Math.floor(i / size);
          const col = i % size;
          const isHit = isOrange(row, col);
          return (
            <div
              key={i}
              style={{
                width: `${baseCircleSize}px`,
                height: `${baseCircleSize}px`,
                opacity: 0.8,
                border: "1px solid rgba(0,0,0,0.8)",
              }}
              className={`rounded-full ${
                isHit ? "bg-orange-400" : "bg-gray-200"
              }`}
            />
          );
        })}

        {/* Diagonal semi-transparent white line with extra length and rounded ends */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <svg className="w-full h-full" viewBox="-10 -10 120 120" preserveAspectRatio="none">
            <line
              x1="-10"
              y1="-10"
              x2="110"
              y2="110"
              stroke="white"
              strokeOpacity="0.85"
              strokeWidth={baseStrokeWidth}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
