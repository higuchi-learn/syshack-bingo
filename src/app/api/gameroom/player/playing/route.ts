import { db } from '@/firebase/init'
import { NextResponse } from 'next/server'
import { doc, getDoc } from 'firebase/firestore'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  const playerId = searchParams.get('playerId')

  if (!roomId || !playerId) {
    return NextResponse.json({ error: 'roomId と playerId が必要です' }, { status: 400 })
  }

  try {
    const playerRef = doc(db, 'gameRooms', roomId, 'players', playerId)
    const playerSnap = await getDoc(playerRef)

    if (!playerSnap.exists()) {
      return NextResponse.json({ error: 'プレイヤーが見つかりません' }, { status: 404 })
    }

    const playerData = playerSnap.data()

    const roomRef = doc(db, 'gameRooms', roomId)
    const roomSnap = await getDoc(roomRef)

    if (!roomSnap.exists()) {
      return NextResponse.json({ error: 'ルームが見つかりません' }, { status: 404 })
    }

    const roomData = roomSnap.data()

    return NextResponse.json({
      success: true,
      playerName: playerData.playerName,
      card: playerData.card,
      customs: roomData.customs || {},
      rank: null, // ← ランキング未実装時は null、後で実装可能
    })
  } catch (error) {
    console.error('GET /player/playing error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
