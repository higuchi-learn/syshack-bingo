'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/init';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { nanoid } from 'nanoid';

export default function PlayerSignInPage() {
  const [playerName, setPlayerName] = useState('');
  const router = useRouter();
  const { roomId } = useParams();

  const handleJoin = async () => {
    if (!playerName.trim()) {
      alert('プレイヤー名を入力してください');
      return;
    }

    const playerId = nanoid(8);
    const playerRef = doc(db, 'gameRooms', String(roomId), 'players', playerId);

    await setDoc(playerRef, {
      playerName,
      joinedAt: new Date(),
      playerId,
    });

    router.push(`/gameroom/${roomId}/player/waiting`); // 待機画面へ遷移（あとで作る）
  };

  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-6 bg-gradient-to-b from-blue-800 to-blue-900 text-white">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <label className="block font-semibold mb-2 text-white text-lg">プレイヤー名</label>
          <Input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="プレイヤー名を入力されていません。"
            className="bg-white text-gray-800 font-medium placeholder:text-gray-400"
          />
        </div>

        <Button
          onClick={handleJoin}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold text-2xl py-6 rounded-xl"
        >
          参加
        </Button>
      </div>
    </main>
  );
}
