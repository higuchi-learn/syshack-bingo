'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/init';
import BingoCard from '@/components/bingo/BingoCard';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

type Progress = {
  reachProbability: number;
  bingoProbability: number;
};

type Customs = {
  [key: string]: boolean;
};

export default function PlayerPlayingPage() {
  const { roomId, playerId } = useParams();

  const [playerName, setPlayerName] = useState('');
  const [card, setCard] = useState<number[]>([]);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [customs, setCustoms] = useState<Customs>({});
  const [progress, setProgress] = useState<Progress | null>(null);
  const [rank, setRank] = useState<number>(0);

  const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  // 初回 GET: card, playerName, customs
  useEffect(() => {
    const fetchInitial = async () => {
      const res = await fetch(`/api/gameroom/player/playing?roomId=${roomId}&playerId=${playerId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setPlayerName(data.playerName);
        setCard(data.card);
        setCustoms(data.customs);
        setRank(data.rank ?? 0);
      } else {
        alert(data.error || '初期データの取得に失敗しました');
      }
    };

    if (roomId && playerId) fetchInitial();
  }, [roomId, playerId]);

  // onSnapshot: progress監視
  useEffect(() => {
    if (!roomId || !playerId) return;
    const unsub = onSnapshot(doc(db, 'gameRooms', roomId, 'players', playerId), (docSnap) => {
      const data = docSnap.data();
      if (data?.progress) {
        setProgress(data.progress);
      }
    });
    return () => unsub();
  }, [roomId, playerId]);

  // onSnapshot: calledNumbers監視
  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, 'gameRooms', roomId), async (docSnap) => {
      const data = docSnap.data();
      if (!data?.calledNumbers) return;

      const newCalledNumbers: number[] = data.calledNumbers;
      if (newCalledNumbers.length > calledNumbers.length) {
        const lastNum = newCalledNumbers[newCalledNumbers.length - 1];
        setHighlightedNumber(lastNum);
        setAcknowledged(false);

        // calledNumbers 更新された → POST
        await fetch(`/api/gameroom/player/progress?roomId=${roomId}&playerId=${playerId}`, {
          method: 'POST',
        });
      }

      setCalledNumbers(newCalledNumbers);
    });
    return () => unsub();
  }, [roomId, playerId, calledNumbers]);

  const handleAcknowledge = () => {
    setAcknowledged(true);
  };

  return (
    <main className="min-h-screen bg-blue-900 text-white p-4 flex flex-col items-center">
      {/* 上部バー */}
      <div className="flex items-center justify-between w-full max-w-xl mb-4 px-4">
        <span className="text-3xl font-bold">#{rank}</span>

        <div className="flex gap-2">
          <div className="bg-yellow-400 text-black rounded-md px-3 py-1 text-center">
            <div className="text-sm font-semibold">リーチ確率</div>
            <div className="text-2xl font-bold">{progress?.reachProbability ?? 0}%</div>
          </div>

          <div className="bg-purple-400 text-black rounded-md px-3 py-1 text-center">
            <div className="text-sm font-semibold">ビンゴ確率</div>
            <div className="text-2xl font-bold">{progress?.bingoProbability ?? 0}%</div>
          </div>
        </div>

        {/* カスタム確認 */}
        <Dialog>
          <DialogTrigger asChild>
            <button className="bg-white text-black rounded px-2 py-1 text-sm font-semibold">カスタムを確認</button>
          </DialogTrigger>
          <DialogContent className="bg-white text-black max-w-md">
            <h2 className="text-lg font-bold mb-4">カスタム設定</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ルール</TableHead>
                  <TableHead className="text-right">有効</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(customs).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell>{key}</TableCell>
                    <TableCell className="text-right font-bold">{value ? 'True' : 'False'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </div>

      {/* カード */}
      <BingoCard
        playerName={playerName}
        card={card}
        calledNumbers={calledNumbers}
        highlightNumber={!acknowledged ? highlightedNumber : null}
        onHighlightClick={handleAcknowledge}
        colorScheme={{
          hit: 'bg-green-500 text-white',
          free: 'bg-lime-400 text-white',
          default: 'bg-gray-400 text-white',
        }}
      />
    </main>
  );
}
