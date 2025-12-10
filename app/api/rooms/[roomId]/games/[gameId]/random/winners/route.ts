import { query } from '@/lib/db/config';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; gameId: string }> }
) {
  try {
    const { gameId } = await params;

    // Get all winners for this game
    const result = await query(
      'SELECT id, game_id, player_id, admin_action, points_awarded, created_at FROM random_winners WHERE game_id = $1 ORDER BY created_at ASC',
      [gameId]
    );

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching winners:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
