'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import BingoCard from '@/components/bingo/BingoCard';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/init';
import DiagonalBingoBoard from '@/components/bingo/DiagonalBingoBoard';

type Player = {
  playerName: string;
  card: number[][];
  progress: {
    hitCount: number;
    reachCount: number;
    bingoCount: number;
    reachProbability: number;
    bingoProbability: number;
    point: number;
  };
};

export default function HostPlayingPage() {
  const { roomId } = useParams();
  const router = useRouter();

  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [bottomPlayers, setBottomPlayers] = useState<Player[]>([]);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [ranking, setRanking] = useState<Player[]>([]);
  const [reachAchievers, setReachAchievers] = useState<string[]>([]);
  const [bingoAchievers, setBingoAchievers] = useState<string[]>([]);
  const [winAchievers, setWinAchievers] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastNumber, setLastNumber] = useState<number | null>(null);
  const [showNumber, setShowNumber] = useState(false);

  useEffect(() => {
    fetchData();
  }, [roomId]);

  const fetchData = async () => {
    const res = await fetch(`/api/gameroom/host/playing?roomId=${roomId}`);
    const data = await res.json();
    if (res.ok && data.success) {
      setCalledNumbers(data.calledNumbers || []);
      setTopPlayers(data.topPlayers || []);
      setBottomPlayers(data.bottomPlayers || []);
      setTotalPlayers(data.totalPlayers || 0);
      setRanking(data.ranking || []);
      setReachAchievers(data.reachAchievers || []);
      setTimeout(() => setReachAchievers([]), 5000);
      setBingoAchievers(data.bingoAchievers || []);
      setTimeout(() => setBingoAchievers([]), 5000);
      setWinAchievers(data.winAchievers || []);
      setTimeout(() => setWinAchievers([]), 5000);
    } else {
      alert(data.error || '情報取得に失敗しました');
    }
  };

  const handleDraw = async () => {
    if (!roomId || isDrawing) return;

    setIsDrawing(true);
    try {
      const res = await fetch(`/api/gameroom/host/playing?roomId=${roomId}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setLastNumber(data.number);
        setShowNumber(true);
        setTimeout(() => setShowNumber(false), 3000);
        setTimeout(fetchData, 3000);
      } else {
        alert(data.error || '抽選に失敗しました');
      }
    } catch (error) {
      console.error(error);
      alert('通信エラーが発生しました');
    } finally {
      setIsDrawing(false);
    }
  };

  const handleFinish = async () => {
    const ok = confirm('ゲームを終了しますか？');
    if (!ok || !roomId) return;
    try {
      const roomRef = doc(db, 'gameRooms', String(roomId));
      await updateDoc(roomRef, { status: 'finished' });
      router.push(`/gameroom/${roomId}/result`);
    } catch (error) {
      console.error(error);
      alert('Firestoreの更新に失敗しました');
    }
  };

  return (
    <main className="min-h-screen w-full bg-sky-400 overflow-hidden relative">
      {/* 背景 */}
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
        {/* リーチ・ビンゴ・勝者の演出 */}
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 text-center space-y-2">
          {reachAchievers.map((name, i) => (
            <div key={`reach-${i}`} className="text-yellow-400 text-2xl font-bold animate-pulse drop-shadow">
              🎯 REACH! {name}
            </div>
          ))}
          {bingoAchievers.map((name, i) => (
            <div key={`bingo-${i}`} className="text-purple-400 text-3xl font-bold animate-bounce drop-shadow">
              🎉 BINGO! {name}
            </div>
          ))}
          {winAchievers.map((name, i) => (
            <div key={`win-${i}`} className="text-green-500 text-4xl font-extrabold animate-bounce drop-shadow-lg">
              🏆 WINNER! {name}
            </div>
          ))}
        </div>

        {/* 抽選番号の表示 */}
        {showNumber && lastNumber !== null && (
          <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-40 bg-yellow-400 text-white text-7xl font-extrabold px-10 py-6 rounded-3xl shadow-2xl animate-bounce">
            {lastNumber}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleFinish} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2">
            ゲームを終了する
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="w-1/2 space-y-4">
            <h2 className="text-xl font-bold">参加者 {totalPlayers}名</h2>
            <div className="bg-gray-100 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-2">TOP 10</h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-0.5">順位</th>
                    <th className="px-0.5">プレイヤー名</th>
                    <th className="px-0.5">ヒット数</th>
                    <th className="px-0.5">リーチ確率</th>
                    <th className="px-0.5">ビンゴ確率</th>
                    <th className="px-0.5">リーチ数</th>
                    <th className="px-0.5">ビンゴ数</th>
                    <th className="px-0.5">評価値</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((player, i) => (
                    <tr key={i}>
                      <td className="px-0.5 font-bold">#{i + 1}</td>
                      <td className="px-0.5">{player.playerName}</td>
                      <td className="px-0.5">{player.progress?.hitCount ?? 0}</td>
                      <td className="px-0.5">{player.progress?.reachProbability ?? 0}%</td>
                      <td className="px-0.5">{player.progress?.bingoProbability ?? 0}%</td>
                      <td className="px-0.5">{player.progress?.reachCount ?? 0}</td>
                      <td className="px-0.5">{player.progress?.bingoCount ?? 0}</td>
                      <td className="px-0.5">{player.progress?.point ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center gap-4">
              <img src="/images/gachagacha.png" alt="抽選器" className="w-40" />
              <Button
                onClick={handleDraw}
                disabled={isDrawing}
                className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold text-xl px-8 py-4 rounded-xl"
              >
                {isDrawing ? '抽選中...' : '抽選'}
              </Button>
            </div>
          </div>

          <div className="w-1/2 grid grid-cols-3 gap-4">
            {/* 上位3名の見出しとカード */}
            {topPlayers.length > 0 && (
              <>
                <div className="col-span-3 text-center text-lg font-bold text-white">上位{topPlayers.length}名</div>
                {topPlayers.slice(0, 3).map((player, index) => (
                  <BingoCard
                    key={`top-${index}`}
                    playerName={player.playerName}
                    card={player.card.flat()}
                    calledNumbers={calledNumbers}
                    colorScheme={{
                      hit: 'bg-green-500 text-white',
                      free: 'bg-lime-400 text-white',
                      default: 'bg-gray-300 text-white',
                    }}
                  />
                ))}
              </>
            )}

            {/* 下位3名の見出しとカード */}
            {bottomPlayers.length > 0 && (
              <>
                <div className="col-span-3 text-center text-lg font-bold text-white mt-4">
                  下位{bottomPlayers.length}名
                </div>
                {bottomPlayers.slice(0, 3).map((player, index) => (
                  <BingoCard
                    key={`bottom-${index}`}
                    playerName={player.playerName}
                    card={player.card.flat()}
                    calledNumbers={calledNumbers}
                    colorScheme={{
                      hit: 'bg-green-500 text-white',
                      free: 'bg-lime-400 text-white',
                      default: 'bg-gray-300 text-white',
                    }}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
