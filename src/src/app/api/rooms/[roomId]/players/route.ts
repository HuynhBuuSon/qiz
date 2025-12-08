import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/config';
import { v4 as uuidv4 } from 'uuid';

// Get all players in a room
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    // Verify room exists
    const roomCheck = await query(
      'SELECT id FROM game_rooms WHERE id = $1',
      [roomId]
    );
    if (roomCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const result = await query(
      'SELECT * FROM players WHERE room_id = $1 ORDER BY rank ASC, score DESC',
      [roomId]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Add a player to a room
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    // Verify room exists
    const roomCheck = await query(
      'SELECT max_players FROM game_rooms WHERE id = $1',
      [roomId]
    );
    if (roomCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Check player count
    const playerCount = await query(
      'SELECT COUNT(*) as count FROM players WHERE room_id = $1',
      [roomId]
    );
    const currentCount = parseInt(playerCount.rows[0].count, 10);
    const maxPlayers = roomCheck.rows[0].max_players;

    if (currentCount >= maxPlayers) {
      return NextResponse.json(
        { error: 'Room is full' },
        { status: 400 }
      );
    }

    const playerId = uuidv4();
    const result = await query(
      `INSERT INTO players (id, room_id, name, score, rank) 
       VALUES ($1, $2, $3, 0, NULL)
       RETURNING *`,
      [playerId, roomId, name.trim()]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error adding player:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
