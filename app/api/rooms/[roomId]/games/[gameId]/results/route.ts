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
    const { roomId, gameId } = await params;
    const body = await req.json();
    const { results } = body; // Array of { playerId, pointsEarned, rank }

    if (!Array.isArray(results)) {
      return NextResponse.json(
        { error: 'Expected array of results' },
        { status: 400 }
      );
    }

    const insertedResults = [];
    
    // Step 1: Save game results
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

    // Step 2: Update player global points and calculate new global rank
    for (const result of results) {
      const { playerId, pointsEarned } = result;
      
      if (!playerId || pointsEarned === undefined) continue;

      // Update player's score by adding game points
      await query(
        `UPDATE players 
         SET score = COALESCE(score, 0) + $1
         WHERE id = $2 AND room_id = $3`,
        [pointsEarned, playerId, roomId]
      );
    }

    // Step 3: Recalculate global ranks for all players in the room
    // Get all players sorted by score (descending)
    const rankingResult = await query(
      `SELECT id FROM players 
       WHERE room_id = $1 
       ORDER BY score DESC, joined_at ASC`,
      [roomId]
    );

    // Update rank for each player
    for (let i = 0; i < rankingResult.rows.length; i++) {
      const player = rankingResult.rows[i];
      await query(
        `UPDATE players 
         SET rank = $1 
         WHERE id = $2`,
        [i + 1, player.id]
      );
    }

    return NextResponse.json({
      message: 'Game results saved and player points updated',
      results: insertedResults,
    });
  } catch (error: any) {
    console.error('Error creating batch game results:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
