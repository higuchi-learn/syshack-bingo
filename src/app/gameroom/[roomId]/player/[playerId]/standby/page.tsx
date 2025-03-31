'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/init';
import DiagonalBingoBoard from '@/components/bingo/DiagonalBingoBoard';

export default function PlayerWaitingPage() {
  const { roomId, playerId } = useParams();
  const router = useRouter();

  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState('');

  // Firestore status監視 → playingなら遷移
  useEffect(() => {
    if (!roomId || !playerId) return;
    const unsub = onSnapshot(doc(db, 'gameRooms', roomId as string), (docSnap) => {
      const data = docSnap.data();
      if (data?.status === 'playing') {
        router.push(`/gameroom/${roomId}/player/${playerId}/playing`);
      }
    });
    return () => unsub();
  }, [roomId, playerId, router]);

  // 初回読み込み時、roomNameとplayerNameを取得
  useEffect(() => {
    const fetchInfo = async () => {
      const res = await fetch(`/api/gameroom/player/standby?roomId=${roomId}&playerId=${playerId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setRoomName(data.roomName);
        setPlayerName(data.playerName);
      } else {
        alert(data.error || '情報の取得に失敗しました');
      }
    };

    if (roomId && playerId) fetchInfo();
  }, [roomId, playerId]);

  return (
    <main className="min-h-screen w-full bg-sky-400 overflow-hidden relative flex flex-col justify-center items-center px-6 text-white">
      {/* 背景用：斜めにしたビンゴボード（左回転・最背面・さらに薄く） */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-10">
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(3) rotate(20deg)',
          }}
        >
          <DiagonalBingoBoard scale={1} />
        </div>
      </div>

      {/* 中央のメッセージ表示部分 */}
      <div className="relative z-10 w-full max-w-md px-6 pb-12 bg-white/70 rounded-xl shadow-lg text-black">
        <div className="space-y-6 text-center">
          <h1 className="text-3xl font-bold drop-shadow-md">参加が完了しました！</h1>
          <p className="text-lg">
            ルーム名: <span className="font-mono text-yellow-600">{roomName}</span>
          </p>
          <p className="text-lg">
            プレイヤー名: <span className="font-mono text-green-600">{playerName}</span>
          </p>
          <p className="text-sm text-gray-700">ゲームが開始されるまで、このままお待ちください…</p>
        </div>
      </div>
    </main>
  );
}
