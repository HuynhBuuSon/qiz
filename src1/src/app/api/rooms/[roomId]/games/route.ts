import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/config';
import { v4 as uuidv4 } from 'uuid';

// Get all games in a room
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
      'SELECT * FROM games WHERE room_id = $1 ORDER BY created_at DESC',
      [roomId]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Create a new game in a room
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { type, name, settings } = body;

    if (!type || !['weight', 'random'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid game type. Must be "weight" or "random"' },
        { status: 400 }
      );
    }

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

    // Get next game order
    const orderResult = await query(
      'SELECT MAX(game_order) as max_order FROM games WHERE room_id = $1',
      [roomId]
    );
    const nextOrder = (orderResult.rows[0]?.max_order || 0) + 1;

    const gameId = uuidv4();
    const gameName = name || `${type.charAt(0).toUpperCase() + type.slice(1)} Game ${nextOrder}`;
    const result = await query(
      `INSERT INTO games (id, room_id, name, type, game_order, status, settings)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [gameId, roomId, gameName, type, nextOrder, 'pending', JSON.stringify(settings || {})]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
