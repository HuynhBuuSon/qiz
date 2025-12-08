import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/config';
import { generateCode } from '@/lib/utils/helpers';
import { v4 as uuidv4 } from 'uuid';

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
    } = body;

    const joinCode = generateCode();
    const presentationCode = generateCode();
    const roomId = uuidv4();

    const result = await query(
      `INSERT INTO game_rooms (
        id, name, join_code, presentation_code, main_color, color_from, color_to,
        max_players, point_mode, point_from, point_to, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        roomId,
        name,
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
