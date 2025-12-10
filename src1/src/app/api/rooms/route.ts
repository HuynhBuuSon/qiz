import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/config';
import { generateCode } from '@/lib/utils/helpers';
import { v4 as uuidv4 } from 'uuid';

// Get all game rooms
export async function GET() {
  try {
    const result = await query(
      'SELECT * FROM game_rooms ORDER BY created_at DESC'
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Generate a unique 4-digit room number
async function generateRoomNumber(): Promise<number> {
  for (let attempts = 0; attempts < 100; attempts++) {
    const roomNumber = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    
    const result = await query(
      'SELECT id FROM game_rooms WHERE room_number = $1',
      [roomNumber]
    );
    
    if (result.rows.length === 0) {
      return roomNumber;
    }
  }
  
  throw new Error('Failed to generate unique room number');
}

// Create a new game room
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      mainColor,
      colorFrom,
      colorTo,
      maxPlayers,
      pointMode,
      pointFrom,
      pointTo,
      createdBy,
      join_code: joinCodeInput,
      presentation_code: presentationCodeInput,
    } = body;

    const joinCode = joinCodeInput || generateCode();
    const presentationCode = presentationCodeInput || generateCode();
    const roomNumber = await generateRoomNumber();
    const roomId = uuidv4();

    const result = await query(
      `INSERT INTO game_rooms (
        id, name, room_number, join_code, presentation_code, main_color, color_from, color_to,
        max_players, point_mode, point_from, point_to, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        roomId,
        name,
        roomNumber,
        joinCode,
        presentationCode,
        mainColor,
        colorFrom,
        colorTo,
        maxPlayers,
        pointMode,
        pointFrom,
        pointTo,
        createdBy,
      ]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
