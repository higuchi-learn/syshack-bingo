import { db } from '@/firebase/init';
import { NextResponse } from 'next/server';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomId, roomName, winLine } = body;

    if (!roomId || !roomName || !winLine) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const roomRef = doc(db, 'gameRooms', roomId);

    await setDoc(roomRef, {
      createdAt: serverTimestamp(),
      roomName,
      status: 'standby',
      customs: {
        winLine: Number(winLine),
        highSpeed: false,
        reverse: false,
        changeProbability: false,
        rareNumber: false,
      },
      calledNumbers: [100],
      winners: [],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ルーム作成エラー:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
