import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/config';

// Get a specific game
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; gameId: string }> }
) {
  try {
    const { roomId, gameId } = await params;

    const result = await query(
      'SELECT * FROM games WHERE id = $1 AND room_id = $2',
      [gameId, roomId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching game:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Update a game (start, end, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; gameId: string }> }
) {
  try {
    const { roomId, gameId } = await params;
    const body = await req.json();
    const { status, config } = body;

    // Get current game
    const gameResult = await query(
      'SELECT * FROM games WHERE id = $1 AND room_id = $2',
      [gameId, roomId]
    );

    if (gameResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    const game = gameResult.rows[0];

    // Build update query
    let updateQuery = 'UPDATE games SET ';
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      updateQuery += `status = $${paramIndex}, `;
      values.push(status);
      paramIndex++;
    }

    if (config) {
      updateQuery += `settings = $${paramIndex}, `;
      values.push(JSON.stringify(config));
      paramIndex++;
    }

    if (values.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Remove trailing comma and space if present
    updateQuery = updateQuery.replace(/,\s*$/, ' ');
    updateQuery += `WHERE id = $${paramIndex} AND room_id = $${paramIndex + 1} RETURNING *`;
    values.push(gameId, roomId);

    const result = await query(updateQuery, values);

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating game:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Delete a game
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; gameId: string }> }
) {
  try {
    const { roomId, gameId } = await params;

    // Get game to verify it exists and check status
    const gameResult = await query(
      'SELECT * FROM games WHERE id = $1 AND room_id = $2',
      [gameId, roomId]
    );

    if (gameResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    const game = gameResult.rows[0];
    if (game.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete an active game' },
        { status: 400 }
      );
    }

    // Delete related data first
    await query('DELETE FROM weight_entries WHERE game_id = $1', [gameId]);
    await query('DELETE FROM weight_game_data WHERE game_id = $1', [gameId]);
    await query('DELETE FROM random_winners WHERE game_id = $1', [gameId]);
    await query('DELETE FROM random_game_data WHERE game_id = $1', [gameId]);
    await query('DELETE FROM game_results WHERE game_id = $1', [gameId]);

    // Delete the game
    await query('DELETE FROM games WHERE id = $1', [gameId]);

    return NextResponse.json(
      { message: 'Game deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting game:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
