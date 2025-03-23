import { db } from '@/firebase/init'
import { NextResponse } from 'next/server'
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore'

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

    const players = playerSnaps.docs.map((doc) => ({
      playerName: doc.data().playerName,
      card: doc.data().card,
      progress: doc.data().progress,
    }))

    return NextResponse.json({
      success: true,
      calledNumbers,
      topPlayers: players.slice(0, 3), // 仮：上位3人
      bottomPlayers: players.slice(-3), // 仮：下位3人
      ranking: players.slice(0, 10),
      totalPlayers: players.length,
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

    return NextResponse.json({ success: true, number: newNumber })
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
