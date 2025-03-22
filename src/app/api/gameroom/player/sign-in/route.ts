import { db } from "@/firebase/init"
import { NextResponse } from "next/server"
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore"
import { nanoid } from "nanoid"

// 🔢 ビンゴカードを生成（中央100固定・1次元化）
function generateBingoCard(): number[] {
  const numbers = Array.from({ length: 75 }, (_, i) => i + 1)
  const shuffled = numbers.sort(() => Math.random() - 0.5).slice(0, 24)
  const card: number[] = []

  for (let i = 0; i < 25; i++) {
    if (i === 12) {
      card.push(100) // 中央
    } else {
      card.push(shuffled.pop()!)
    }
  }

  return card
}

// ✅ GET
export async function GET(
  _: Request,
  { params }: { params: { roomId: string } }
) {
  const { roomId } = params

  try {
    const roomRef = doc(db, "gameRooms", roomId)
    const roomSnap = await getDoc(roomRef)

    if (!roomSnap.exists()) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    const roomData = roomSnap.data()
    const playersRef = collection(db, "gameRooms", roomId, "players")
    const playerSnap = await getDocs(playersRef)
    const playerNames = playerSnap.docs.map((doc) => doc.data().playerName || "名無し")

    return NextResponse.json({
      success: true,
      roomId,
      roomName: roomData.roomName,
      status: roomData.status,
      players: playerNames
    })
  } catch (error) {
    console.error("GET error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// ✅ POST
export async function POST(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  const { roomId } = params
  const { playerName } = await req.json()

  if (!roomId || !playerName || typeof playerName !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  try {
    const playersRef = collection(db, "gameRooms", roomId, "players")
    const q = query(playersRef, where("playerName", "==", playerName.trim()))
    const existing = await getDocs(q)

    if (!existing.empty) {
      return NextResponse.json({ error: "この名前は既に使用されています" }, { status: 409 })
    }

    const playerId = nanoid(8)
    const card = generateBingoCard() // ← 🔥 1次元配列に対応！

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
      }
    })

    return NextResponse.json({ success: true, playerId })
  } catch (error) {
    console.error("POST error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
