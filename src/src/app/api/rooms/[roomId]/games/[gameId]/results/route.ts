import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/config';

// Get game results
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; gameId: string }> }
) {
  try {
    const { gameId } = await params;

    const result = await query(
      `SELECT gr.*, p.name, p.score, p.rank 
       FROM game_results gr
       JOIN players p ON gr.player_id = p.id
       WHERE gr.game_id = $1
       ORDER BY gr.rank ASC`,
      [gameId]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching game results:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Create game result
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const body = await req.json();
    const { playerId, pointsEarned, rank } = body;

    if (!playerId || pointsEarned === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: playerId, pointsEarned' },
        { status: 400 }
      );
    }

    // Upsert game result (update if exists, insert if not)
    const result = await query(
      `INSERT INTO game_results (game_id, player_id, points_earned, rank)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (game_id, player_id) 
       DO UPDATE SET 
         points_earned = EXCLUDED.points_earned,
         rank = COALESCE(EXCLUDED.rank, game_results.rank)
       RETURNING *`,
      [gameId, playerId, pointsEarned, rank || null]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating game result:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Batch create game results (for end game)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const body = await req.json();
    const { results } = body; // Array of { playerId, pointsEarned, rank }

    if (!Array.isArray(results)) {
      return NextResponse.json(
        { error: 'Expected array of results' },
        { status: 400 }
      );
    }

    const insertedResults = [];
    for (const result of results) {
      const { playerId, pointsEarned, rank } = result;
      
      if (!playerId || pointsEarned === undefined) continue;

      const res = await query(
        `INSERT INTO game_results (game_id, player_id, points_earned, rank)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (game_id, player_id) 
         DO UPDATE SET 
           points_earned = EXCLUDED.points_earned,
           rank = COALESCE(EXCLUDED.rank, game_results.rank)
         RETURNING *`,
        [gameId, playerId, pointsEarned, rank || null]
      );
      
      insertedResults.push(res.rows[0]);
    }

    return NextResponse.json(insertedResults);
  } catch (error: any) {
    console.error('Error creating batch game results:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
