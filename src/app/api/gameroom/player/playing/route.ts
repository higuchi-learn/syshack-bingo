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

    const hitCount = grid.filter(v => v === 1).length;
    let bingoCount = 0;
    let reachCount = 0;
    let point = hitCount;

    let newBingo = 0;
    let newReach = 0;

    const reachLineTargetsList: number[][] = [];
    const bingoLineTargetsList: number[][] = [];
    const reachCountLines: number[] = [];
    const bingoCountLines: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const cardLine = Array.from({ length: size }, (_, j) => {
        if (i < 10) {
          const row = i % 2 === 0;
          return row
            ? card[Math.floor(i / 2) * size + j]
            : card[j * size + Math.floor(i / 2)];
        } else {
          const diagIndices = i === 10 ? [0, 6, 12, 18, 24] : [4, 8, 12, 16, 20];
          return card[diagIndices[j]];
        }
      });

      const sum = line.reduce((a, b) => a + b, 0);
      const missingNumbers = cardLine.filter((_, idx) => line[idx] === 0);

      if (sum === 5) {
        bingoCount++;
        point += 10;
        if (!(previousProgress.bingoCountLines || []).includes(i)) newBingo++;
        bingoCountLines.push(i);
      } else if (sum === 4 && missingNumbers.length === 1) {
        reachCount++;
        point += 5;
        if (!(previousProgress.reachCountLines || []).includes(i)) newReach++;
        reachCountLines.push(i);
        reachLineTargetsList.push(missingNumbers);
      } else if (sum === 3 && missingNumbers.length === 2) {
        bingoLineTargetsList.push(missingNumbers);
      } else if (sum === 3) {
        point += 2;
      } else if (sum === 2) {
        point += 1;
      }
    }

    const specialIndices = [0, 4, 6, 8, 16, 18, 20, 24];
    const specialFilled = specialIndices.filter(i => grid[i] === 1).length;
    point += specialFilled * 2;

    const remaining = 75 - calledNumbers.length;

    const bingoTargetNumbers = [...new Set(reachLineTargetsList.flat())];
    const reachTargetNumbers = [...new Set(bingoLineTargetsList.flat())];

    const bingoProbability = remaining > 0
      ? Math.min(100, Math.round((bingoTargetNumbers.length / remaining) * 100))
      : 0;

    const reachProbability = remaining > 0
      ? Math.min(100, Math.round((reachTargetNumbers.length / remaining) * 100))
      : 0;

    const winerFlag = bingoCount >= winLine;
    const drawCount = calledNumbers.length;

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
      reachCountLines,
      bingoCountLines,
      reachDrawCount: previousProgress.reachDrawCount ?? (newReach > 0 ? drawCount : null),
      bingoDrawCount: previousProgress.bingoDrawCount ?? (newBingo > 0 ? drawCount : null),
      wonDrawCount: previousProgress.wonDrawCount,
    };

    // wonDrawCount を初回のみセット
    if (winerFlag && progress.wonDrawCount == null) {
      progress.wonDrawCount = drawCount;
    }

    await updateDoc(playerRef, { progress });

    if (winerFlag) {
      const winners: string[] = roomData.winners || [];
      const isAlreadyWinner = winners.includes(playerId);

      const updates = [];

      if (!isAlreadyWinner) {
        updates.push(updateDoc(roomRef, {
          winners: [...winners, playerId],
        }));
      }

      const metaRef = doc(db, 'gameRooms', roomId, 'players', playerId, 'meta', 'info');
      updates.push(updateDoc(metaRef, { won: true }));

      await Promise.all(updates);
    }

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error('POST /player/playing error:', error);
    return NextResponse.json({ success: false, error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
