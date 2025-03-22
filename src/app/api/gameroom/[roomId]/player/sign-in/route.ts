import { db } from "@/firebase/init"
import { NextResponse } from "next/server"
import { doc, getDoc, collection, getDocs } from "firebase/firestore"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get("roomId")

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 })
  }

  try {
    const roomRef = doc(db, "gameRooms", roomId)
    const roomSnap = await getDoc(roomRef)

    if (!roomSnap.exists()) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    const roomData = roomSnap.data()

    // 🔽 players サブコレクションから全員の playerName を取得
    const playersRef = collection(db, "gameRooms", roomId, "players")
    const playerSnap = await getDocs(playersRef)

    const playerNames = playerSnap.docs.map((doc) => doc.data().playerName || "名無し")

    return NextResponse.json({
      success: true,
      roomId,
      roomName: roomData.roomName,
      status: roomData.status,
      players: playerNames,
    })
  } catch (error) {
    console.error("GET /api/sign-in error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
