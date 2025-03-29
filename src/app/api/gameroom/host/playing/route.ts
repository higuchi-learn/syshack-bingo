import { db } from '@/firebase/init'
import { NextResponse } from 'next/server'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  if (!roomId) {
    return NextResponse.json({ error: 'roomId is required' }, { status: 400 })
  }

  try {
    const roomRef = doc(db, 'gameRooms', roomId)
    const roomSnap = await getDoc(roomRef)
    if (!roomSnap.exists()) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const roomData = roomSnap.data()
    const calledNumbers = roomData.calledNumbers || []

    const playersRef = collection(db, 'gameRooms', roomId, 'players')
    const playerSnaps = await getDocs(playersRef)

    const players = await Promise.all(
      playerSnaps.docs.map(async (docSnap) => {
        const playerData = docSnap.data()
        const metaRef = doc(db, 'gameRooms', roomId, 'players', docSnap.id, 'meta', 'info')
        const metaSnap = await getDoc(metaRef)
        const meta = metaSnap.exists() ? metaSnap.data() : {}

        return {
          id: docSnap.id,
          playerName: playerData.playerName,
          card: playerData.card,
          progress: playerData.progress,
          point: playerData.progress?.point ?? 0,
          meta,
        }
      })
    )

    // won: true のプレイヤーを除外
    const visiblePlayers = players.filter(p => p.meta?.won !== true)

    const sorted = visiblePlayers.sort((a, b) => b.point - a.point)

    const reachAchievers = sorted
      .filter((p) => p.progress?.reachFlag)
      .map((p) => p.playerName)

    const bingoAchievers = sorted
      .filter((p) => p.progress?.bingoFlag)
      .map((p) => p.playerName)

    const winAchievers = (roomData.winners || []).map((id: string) => {
      const playerDoc = playerSnaps.docs.find((d) => d.id === id)
      return playerDoc?.data().playerName || '???'
    })

    return NextResponse.json({
      success: true,
      calledNumbers,
      topPlayers: sorted.slice(0, 3),
      bottomPlayers: sorted.slice(-3),
      ranking: sorted.slice(0, 10),
      totalPlayers: sorted.length,
      reachAchievers,
      bingoAchievers,
      winAchievers,
    })
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  if (!roomId) {
    return NextResponse.json({ error: 'roomId is required' }, { status: 400 })
  }

  try {
    const roomRef = doc(db, 'gameRooms', roomId)
    const roomSnap = await getDoc(roomRef)
    if (!roomSnap.exists()) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const data = roomSnap.data()
    const calledNumbers: number[] = data.calledNumbers || []

    const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1)
    const remaining = allNumbers.filter((n) => !calledNumbers.includes(n))

    if (remaining.length === 0) {
      return NextResponse.json({ error: 'すべての番号が抽選済みです' }, { status: 400 })
    }

    const newNumber = remaining[Math.floor(Math.random() * remaining.length)]
    const updatedNumbers = [...calledNumbers, newNumber]

    await updateDoc(roomRef, { calledNumbers: updatedNumbers })

    // ↓ ランキング更新（progress.point をもとに meta/info.rank に保存）
    const playersRef = collection(db, 'gameRooms', roomId, 'players')
    const playerSnaps = await getDocs(playersRef)

    const ranked = playerSnaps.docs
      .map((doc) => ({
        playerId: doc.id,
        point: doc.data().progress?.point ?? 0,
      }))
      .sort((a, b) => b.point - a.point)

    const batch = writeBatch(db)
    ranked.forEach((player, index) => {
      const metaRef = doc(db, 'gameRooms', roomId, 'players', player.playerId, 'meta', 'info')
      batch.set(metaRef, { rank: index + 1 }, { merge: true })
    })
    await batch.commit()

    return NextResponse.json({ success: true, number: newNumber })
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
