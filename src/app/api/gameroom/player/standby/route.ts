import { db } from '@/firebase/init'
import { NextResponse } from 'next/server'
import { doc, getDoc } from 'firebase/firestore'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  const playerId = searchParams.get('playerId')

  if (!roomId || !playerId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  try {
    const roomSnap = await getDoc(doc(db, 'gameRooms', roomId))
    const playerSnap = await getDoc(doc(db, 'gameRooms', roomId, 'players', playerId))

    if (!roomSnap.exists() || !playerSnap.exists()) {
      return NextResponse.json({ error: 'Room or player not found' }, { status: 404 })
    }

    const roomName = roomSnap.data().roomName
    const playerName = playerSnap.data().playerName

    return NextResponse.json({ success: true, roomName, playerName })
  } catch (error) {
    console.error('GET /standby error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
