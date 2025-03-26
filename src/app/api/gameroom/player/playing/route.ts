import { db } from '@/firebase/init';
import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const playerId = searchParams.get('playerId');

  if (!roomId || !playerId) {
    return NextResponse.json({ success: false, error: 'roomId と playerId は必須です' }, { status: 400 });
  }

  try {
    const playerRef = doc(db, 'gameRooms', roomId, 'players', playerId);
    const roomRef = doc(db, 'gameRooms', roomId);

    const [playerSnap, roomSnap] = await Promise.all([getDoc(playerRef), getDoc(roomRef)]);

    if (!playerSnap.exists()) {
      return NextResponse.json({ success: false, error: 'プレイヤーが見つかりません' }, { status: 404 });
    }

    if (!roomSnap.exists()) {
      return NextResponse.json({ success: false, error: 'ルームが見つかりません' }, { status: 404 });
    }

    const playerData = playerSnap.data();
    const roomData = roomSnap.data();

    return NextResponse.json({
      success: true,
      playerName: playerData.playerName,
      card: playerData.card,
      customs: roomData.customs || {},
    });
  } catch (error) {
    console.error('GET /player/playing error:', error);
    return NextResponse.json({ success: false, error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const playerId = searchParams.get('playerId');

  if (!roomId || !playerId) {
    return NextResponse.json({ success: false, error: 'roomId と playerId は必須です' }, { status: 400 });
  }

  try {
    const playerRef = doc(db, 'gameRooms', roomId, 'players', playerId);
    const playerSnap = await getDoc(playerRef);
    if (!playerSnap.exists()) {
      return NextResponse.json({ success: false, error: 'プレイヤーが存在しません' }, { status: 404 });
    }

    const playerData = playerSnap.data();
    const card: number[] = playerData.card;
    const previousProgress = playerData.progress || {};

    const roomRef = doc(db, 'gameRooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) {
      return NextResponse.json({ success: false, error: 'ルームが存在しません' }, { status: 404 });
    }

    const roomData = roomSnap.data();
    const calledNumbers: number[] = roomData.calledNumbers ?? [];
    const winLine: number = roomData.customs?.winLine ?? 1;

    const size = 5;
    const grid = card.map((num) => num === 100 || calledNumbers.includes(num) ? 1 : 0);
    const lines: number[][] = [];

    for (let i = 0; i < size; i++) {
      const row = grid.slice(i * size, (i + 1) * size);
      const col = Array.from({ length: size }, (_, j) => grid[j * size + i]);
      lines.push(row, col);
    }

    const diag1 = [0, 6, 12, 18, 24].map(i => grid[i]);
    const diag2 = [4, 8, 12, 16, 20].map(i => grid[i]);
    lines.push(diag1, diag2);

    let hitCount = grid.filter(v => v === 1).length;
    let bingoCount = 0;
    let reachCount = 0;
    let point = hitCount;

    let newBingo = 0;
    let newReach = 0;

    for (let i = 0; i < lines.length; i++) {
      const sum = lines[i].reduce((a, b) => a + b, 0);
      if (sum === 5) {
        bingoCount++;
        point += 10;
        if (!(previousProgress.bingoCountLines || []).includes(i)) newBingo++;
      } else if (sum === 4) {
        reachCount++;
        point += 5;
        if (!(previousProgress.reachCountLines || []).includes(i)) newReach++;
      } else if (sum === 3) {
        point += 3;
      }
    }

    const corners = [0, 4, 20, 24].filter(i => grid[i] === 1).length;
    point += corners * 2;

    const remaining = 75 - calledNumbers.length;

    const reachLineTargets = lines
      .map((l, idx) => ({ line: l, idx }))
      .filter(({ line }) => line.reduce((a, b) => a + b, 0) === 3)
      .flatMap(({ line, idx }) =>
        line.map((v, i) => v === 0 ? card[Math.floor(idx / 2) * size + i] : null).filter(v => v !== null)
      );

    const bingoLineTargets = lines
      .map((l, idx) => ({ line: l, idx }))
      .filter(({ line }) => line.reduce((a, b) => a + b, 0) === 4)
      .map(({ line, idx }) => {
        const missingIndex = line.findIndex(v => v === 0);
        return card[Math.floor(idx / 2) * size + missingIndex];
      });

    const reachProbability = remaining > 0 ? Math.round((new Set(reachLineTargets).size / remaining) * 100) : 0;
    const bingoProbability = remaining > 0 ? Math.round((new Set(bingoLineTargets).size / remaining) * 100) : 0;

    const winerFlag = bingoCount >= winLine;

    const progress = {
      hitCount,
      reachCount,
      bingoCount,
      reachProbability,
      bingoProbability,
      point,
      reachFlag: newReach > 0,
      bingoFlag: newBingo > 0,
      winerFlag,
      reachCountLines: lines.map((l, i) => l.reduce((a, b) => a + b, 0) === 4 ? i : -1).filter(i => i >= 0),
      bingoCountLines: lines.map((l, i) => l.reduce((a, b) => a + b, 0) === 5 ? i : -1).filter(i => i >= 0),
    };

    await updateDoc(playerRef, { progress });

    if (winerFlag) {
      const winners: string[] = roomData.winners || [];
      if (!winners.includes(playerId)) {
        await updateDoc(roomRef, {
          winners: [...winners, playerId],
        });
      }
    }

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error('POST /player/playing error:', error);
    return NextResponse.json({ success: false, error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
