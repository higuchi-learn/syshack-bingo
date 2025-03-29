'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/init';
import BingoCard from '@/components/bingo/BingoCard';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

type Progress = {
  hitCount: number;
  reachCount: number;
  bingoCount: number;
  reachProbability: number;
  bingoProbability: number;
  reachFlag: boolean;
  bingoFlag: boolean;
};

export default function PlayerPlayingPage() {
  const { roomId, playerId } = useParams();

  const [playerName, setPlayerName] = useState('');
  const [card, setCard] = useState<number[]>([]);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [customs, setCustoms] = useState<Record<string, string | number | boolean>>({});
  const [progress, setProgress] = useState<Progress | null>(null);
  const [rank, setRank] = useState<number>(0);

  const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [effectText, setEffectText] = useState<string | null>(null);

  const prevCalledRef = useRef<number[]>([]);

  useEffect(() => {
    const fetchInitial = async () => {
      const res = await fetch(`/api/gameroom/player/playing?roomId=${roomId}&playerId=${playerId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setPlayerName(data.playerName);
        setCard(data.card);
        setCustoms(data.customs);
      } else {
        alert(data.error || '初期データの取得に失敗しました');
      }
    };

    if (roomId && playerId) fetchInitial();
  }, [roomId, playerId]);

  useEffect(() => {
    if (!roomId || !playerId) return;
    if (typeof roomId !== 'string' || typeof playerId !== 'string') return;

    const playerRef = doc(db, 'gameRooms', roomId, 'players', playerId);
    const unsub = onSnapshot(playerRef, (docSnap) => {
      const data = docSnap.data();
      if (data?.progress) {
        setProgress((prev) => (JSON.stringify(prev) !== JSON.stringify(data.progress) ? data.progress : prev));
      }
    });

    return () => unsub();
  }, [roomId, playerId]);

  useEffect(() => {
    if (!roomId || !playerId) return;
    if (typeof roomId !== 'string' || typeof playerId !== 'string') return;

    const metaRef = doc(db, 'gameRooms', roomId, 'players', playerId, 'meta', 'info');
    const unsubMeta = onSnapshot(metaRef, (docSnap) => {
      const data = docSnap.data();
      if (typeof data?.rank === 'number') {
        setRank((prev) => (prev !== data.rank ? data.rank : prev));
      }
    });

    return () => unsubMeta();
  }, [roomId, playerId]);

  useEffect(() => {
    if (!roomId) return;
    if (typeof roomId !== 'string') return;

    const unsub = onSnapshot(doc(db, 'gameRooms', roomId), async (docSnap) => {
      const data = docSnap.data();
      if (!data?.calledNumbers) return;

      const newCalledNumbers: number[] = data.calledNumbers;
      const prevCalledNumbers = prevCalledRef.current;

      if (newCalledNumbers.length > prevCalledNumbers.length) {
        const added = newCalledNumbers.find((num) => !prevCalledNumbers.includes(num));

        if (added !== undefined && card.includes(added)) {
          setAcknowledged(false);
          setHighlightedNumber(added);
        }

        await fetch(`/api/gameroom/player/playing?roomId=${roomId}&playerId=${playerId}`, {
          method: 'POST',
        }).catch((err) => console.error('通信エラー:', err));
      }

      prevCalledRef.current = newCalledNumbers;
      setCalledNumbers(newCalledNumbers);
    });
    return () => unsub();
  }, [roomId, playerId, card]);

  const handleAcknowledge = () => {
    setAcknowledged(true);

    if (progress?.reachFlag || progress?.bingoFlag) {
      let text = '';
      if (progress.reachFlag) text += 'REACH';
      if (progress.bingoFlag) text += text ? ' & BINGO!' : 'BINGO!';
      setEffectText(text);
      setTimeout(() => setEffectText(null), 3000);
    }
  };

  return (
    <main className="min-h-screen bg-blue-900 text-white p-4 flex flex-col items-center relative">
      {effectText && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 text-6xl font-extrabold text-pink-500 animate-bounce drop-shadow-xl">
          {effectText}
        </div>
      )}

      <div className="flex items-center justify-between w-full max-w-xl mb-4 px-4">
        <span className="text-3xl font-bold">#{rank}</span>

        <div className="flex gap-2">
          <div className="bg-yellow-400 text-black rounded-md px-3 py-1 text-center">
            <div className="text-sm font-semibold">リーチ確率</div>
            {progress ? (
              <div className="text-2xl font-bold">{progress.reachProbability}%</div>
            ) : (
              <div className="text-sm text-gray-700">読み込み中...</div>
            )}
          </div>

          <div className="bg-purple-400 text-black rounded-md px-3 py-1 text-center">
            <div className="text-sm font-semibold">ビンゴ確率</div>
            {progress ? (
              <div className="text-2xl font-bold">{progress.bingoProbability}%</div>
            ) : (
              <div className="text-sm text-gray-700">読み込み中...</div>
            )}
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <button className="bg-white text-black rounded px-2 py-1 text-sm font-semibold">カスタムを確認</button>
          </DialogTrigger>
          <DialogContent className="bg-white text-black max-w-md">
            <DialogTitle className="text-lg font-bold mb-4">カスタム設定</DialogTitle>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ルール</TableHead>
                  <TableHead className="text-right">値</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(customs || {}).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell>{key}</TableCell>
                    <TableCell className="text-right font-bold">
                      {typeof value === 'boolean' ? (value ? 'True' : 'False') : String(value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </div>

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
