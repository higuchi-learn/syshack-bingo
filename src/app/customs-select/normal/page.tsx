'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

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
    <main className="min-h-screen flex flex-col justify-between px-6 py-10 bg-white">
      <div>
        <h1 className="text-3xl font-bold border-b pb-4 mb-8">カスタムを設定</h1>

        {/* ルーム名入力 */}
        <div className="mb-8">
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
        <div className="flex items-start justify-between">
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
      </div>

      {/* 募集開始ボタン */}
      <div className="flex justify-end mt-10">
        <Button
          onClick={handleSubmit}
          className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-6 py-2 rounded"
        >
          募集開始
        </Button>
      </div>
    </main>
  );
}
