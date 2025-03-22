import { db } from '@/firebase/init';
import { NextResponse } from 'next/server';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { nanoid } from 'nanoid';

// ビンゴカード（5x5, 中央100, 1次元配列）を生成
function generateBingoCard(): number[] {
  const nums = Array.from({ length: 75 }, (_, i) => i + 1);
  const shuffled = nums.sort(() => Math.random() - 0.5).slice(0, 24);
  const card: number[] = [];
  for (let i = 0; i < 25; i++) {
    card.push(i === 12 ? 100 : shuffled.pop()!);
  }
  return card;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
  }

  try {
    const roomRef = doc(db, 'gameRooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const roomData = roomSnap.data();
    const playersRef = collection(db, 'gameRooms', roomId, 'players');
    const playerSnap = await getDocs(playersRef);
    const playerNames = playerSnap.docs.map((doc) => doc.data().playerName || '名無し');

    return NextResponse.json({
      success: true,
      roomId,
      roomName: roomData.roomName,
      status: roomData.status,
      players: playerNames,
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const { playerName } = await req.json();

  if (!roomId || !playerName || typeof playerName !== 'string') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    const playersRef = collection(db, 'gameRooms', roomId, 'players');
    const q = query(playersRef, where('playerName', '==', playerName.trim()));
    const existing = await getDocs(q);

    if (!existing.empty) {
      return NextResponse.json({ error: 'この名前は既に使用されています' }, { status: 409 });
    }

    const playerId = nanoid(8);
    const card = generateBingoCard();

    await setDoc(doc(playersRef, playerId), {
      playerName: playerName.trim(),
      card,
      progress: {
        hitCount: 1,
        reachCount: 0,
        bingoCount: 0,
        reachProbability: 0,
        bingoProbability: 0,
        point: 0,
        reachFlag: false,
        bingoFlag: false,
        winerFlag: false,
      },
    });

    return NextResponse.json({ success: true, playerId });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
