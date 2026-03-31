import { query } from '@/lib/db/config';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const { playerId, action, pointsAwarded } = await req.json();

    if (!playerId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: playerId, action' },
        { status: 400 }
      );
    }

    // Insert winner record
    const result = await query(
      `INSERT INTO random_winners (game_id, player_id, admin_action, points_awarded)
       VALUES ($1, $2, $3, $4)
       RETURNING id, game_id, player_id, admin_action, points_awarded, created_at`,
      [gameId, playerId, action, pointsAwarded || 0]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating winner record:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
