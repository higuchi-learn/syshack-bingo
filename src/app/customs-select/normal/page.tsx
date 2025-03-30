'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import DiagonalBingoBoard from '@/components/bingo/DiagonalBingoBoard';

export default function NormalCustomPage() {
  const [roomName, setRoomName] = useState('');
  const [winLine, setWinLine] = useState('1');
  const router = useRouter();

  const handleSubmit = async () => {
    const roomId = nanoid(8);

    try {
      const res = await fetch('/api/customs-select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, roomName, winLine }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/gameroom/${roomId}/host/standby`);
      } else {
        alert(data.error || 'ルーム作成に失敗しました');
      }
    } catch (err) {
      console.error('通信エラー:', err);
      alert('通信エラーが発生しました');
    }
  };

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
      <div className="relative z-10 w-full px-6 pb-12">
        {/* タイトル */}
        <div className="bg-[#FFE500] pt-6 pb-6 pl-6 -mx-6">
          <h1 className="text-4xl font-extrabold text-black text-left">ゲーム設定</h1>
        </div>

        {/* カードで囲む本体UI */}
        <div className="max-w-4xl mx-auto mt-10 bg-white bg-opacity-90 shadow-md rounded-2xl p-8 space-y-8">
          {/* ルーム名入力 */}
          <div>
            <label className="block text-lg font-semibold mb-2">ルーム名を入力</label>
            <Input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="例）会社ビンゴ大会"
              className="w-full max-w-md"
            />
          </div>

          {/* ライン数選択 */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold">報酬獲得のライン数</h2>
              <p className="text-sm text-gray-600 mb-2">設定したライン数に達するまで報酬ゲットにはなりません。</p>
            </div>
            <div className="w-32">
              <Select value={winLine} onValueChange={setWinLine}>
                <SelectTrigger>
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 募集開始ボタン */}
          <div className="fixed bottom-6 right-6 z-20">
            <Button
              onClick={handleSubmit}
              className="bg-[#F39800] hover:bg-orange-600 text-white font-bold text-lg px-8 py-3 rounded shadow-lg"
            >
              募集開始
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
