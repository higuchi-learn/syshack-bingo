import { db } from '@/firebase/init';
import { NextResponse } from 'next/server';
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json({ success: false, error: 'roomId is required' }, { status: 400 });
  }

  try {
    const roomRef = doc(db, 'gameRooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    const roomData = roomSnap.data();
    const calledNumbers: number[] = roomData.calledNumbers || [];

    const playersRef = collection(db, 'gameRooms', roomId, 'players');
    const playerSnaps = await getDocs(playersRef);

    const players = await Promise.all(
      playerSnaps.docs.map(async (docSnap) => {
        const playerData = docSnap.data();
        const metaRef = doc(db, 'gameRooms', roomId, 'players', docSnap.id, 'meta', 'info');
        const metaSnap = await getDoc(metaRef);
        const meta = metaSnap.exists() ? metaSnap.data() : {};

        return {
          id: docSnap.id,
          playerName: playerData.playerName,
          card: playerData.card,
          progress: playerData.progress || {},
          meta,
        };
      })
    );

    // won: true / false で分割
    const winners = players
      .filter(p => p.meta?.won === true)
      .sort((a, b) => (a.progress?.wonDrawCount ?? Infinity) - (b.progress?.wonDrawCount ?? Infinity));

    const others = players
      .filter(p => p.meta?.won !== true)
      .sort((a, b) => (b.progress?.point ?? 0) - (a.progress?.point ?? 0));

    const sortedPlayers = [...winners, ...others];

    const lowestPlayer = others[others.length - 1] || winners[winners.length - 1]; // 全員wonならwinnersの最後

    return NextResponse.json({
      success: true,
      players: sortedPlayers.map(p => ({
        id: p.id,
        playerName: p.playerName,
        progress: p.progress,
        meta: p.meta,
      })),
      calledNumbers,
      lowestCard: lowestPlayer?.card || [],
    });
  } catch (error) {
    console.error('GET /gameroom/result error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
