'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, collection, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/init';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import DiagonalBingoBoard from '@/components/bingo/DiagonalBingoBoard';

export default function StandbyPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);

  // Firestore: ルーム情報取得（roomName）
  useEffect(() => {
    if (!roomId) return;
    const fetchRoomName = async () => {
      const roomRef = doc(db, 'gameRooms', String(roomId));
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const data = snap.data();
        setRoomName(data.roomName || '');
      }
    };
    fetchRoomName();
  }, [roomId]);

  // Firestore: playersのサブコレクションをonSnapshotで監視
  useEffect(() => {
    if (!roomId) return;

    const playersRef = collection(db, 'gameRooms', String(roomId), 'players');

    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      const newPlayers = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().playerName || '名無し',
      }));
      setPlayers(newPlayers);
    });

    return () => unsubscribe();
  }, [roomId]);

  // ゲーム開始処理
  const handleStart = async () => {
    const roomRef = doc(db, 'gameRooms', String(roomId));
    await updateDoc(roomRef, { status: 'playing' });
    router.push(`/gameroom/${roomId}/host/playing`);
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
      {/* UI全体ラップ */}
      <div className="relative z-10 w-full px-6 pb-12">
        {/* タイトル */}
        <div className="bg-[#FFE500] pt-6 pb-6 pl-6 -mx-6">
          <h1 className="text-4xl font-extrabold text-black text-left">{roomName}</h1>
        </div>

        {/* QRコードと参加者情報 */}
        <div className="flex justify-between items-start mt-6 flex-wrap gap-6">
          {/* QRコード */}
          <div className="relative z-10">
            <QRCodeSVG value={`${process.env.NEXT_PUBLIC_BASE_URL}/gameroom/${roomId}/player/sign-in`} size={700} />
          </div>

          {/* 参加者リスト */}
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-4">参加者：{players.length}名</h2>
            <ul className="bg-gray-100 p-4 rounded max-h-[320px] overflow-y-auto w-64 shadow-md">
              {players.map((p) => (
                <li key={p.id} className="mb-2">
                  {p.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ゲーム開始ボタン（右下固定） */}
      <div className="fixed bottom-6 right-6 z-20">
        <Button
          onClick={handleStart}
          className="bg-[#F39800] hover:bg-orange-600 text-white font-bold text-lg px-8 py-3 rounded shadow-lg"
        >
          ゲーム開始
        </Button>
      </div>
    </main>
  );
}
