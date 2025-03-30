// src/app/mode-select/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import DiagonalBingoBoard from '@/components/bingo/DiagonalBingoBoard';

export default function ModeSelectPage() {
  const router = useRouter();

  const modes = [
    {
      title: 'スピードビンゴで遊ぶ',
      description: '３×３のビンゴカードで遊びます。短時間でゲームを終了させたい方にオススメです。',
      imageAlt: 'イラストもしくは写真',
      path: '/customs-select/speed',
    },
    {
      title: '普通のビンゴで遊ぶ',
      description: '一般的なビンゴのルールです。報酬獲得までのビンゴライン数は設定することができます。',
      imageAlt: '',
      path: '/customs-select/normal',
    },
    {
      title: 'カスタムビンゴで遊ぶ',
      description: '抽選される番号の確率を操作するなどの、当サービス独自ルールが適用されたビンゴです。',
      imageAlt: '',
      path: '/customs-select/custom',
    },
  ];

  return (
    <main className="min-h-screen w-full bg-sky-400 overflow-hidden relative">
      {/* 背景用：斜めにしたビンゴボード（左回転・最背面） */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute"
          style={{
            top: '35%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(3) rotate(30deg)',
          }}
        >
          <DiagonalBingoBoard scale={1.5} />
        </div>
      </div>

      {/* UIコンテンツ（最前面） */}
      <div className="relative z-10 w-full">
        {/* タイトル（左寄せ + スペース） */}
        <div className="bg-[#FFE500] pt-6 pb-6 pl-6">
          <h1 className="text-4xl font-extrabold text-black text-left">ゲームモードを選択</h1>
        </div>

        {/* モード選択カード（変更なし） */}
        <div className="max-w-4xl mx-auto py-12 px-4 space-y-10">
          {modes.map((mode, index) => (
            <div
              key={index}
              onClick={() => router.push(mode.path)}
              className="cursor-pointer bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition flex items-center justify-between flex-wrap"
            >
              <div>
                <h2 className="text-2xl font-bold mb-2">{mode.title}</h2>
                <p className="text-gray-700 text-base whitespace-pre-line">{mode.description}</p>
              </div>
              <div className="w-32 h-20 bg-gray-300 rounded-md flex items-center justify-center text-xs text-gray-600 text-center whitespace-pre mt-4 sm:mt-0">
                {mode.imageAlt || 'イラスト\nもしくは\n写真'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
