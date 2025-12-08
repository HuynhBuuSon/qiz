import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/config';

// Get a specific player
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; playerId: string }> }
) {
  try {
    const { roomId, playerId } = await params;

    const result = await query(
      'SELECT * FROM players WHERE id = $1 AND room_id = $2',
      [playerId, roomId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Update a player (score, rank, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; playerId: string }> }
) {
  try {
    const { roomId, playerId } = await params;
    const body = await req.json();
    const { name, score, rank } = body;

    // Verify player exists
    const playerCheck = await query(
      'SELECT id FROM players WHERE id = $1 AND room_id = $2',
      [playerId, roomId]
    );

    if (playerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Build update query
    let updateQuery = 'UPDATE players SET ';
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateQuery += `name = $${paramIndex}, `;
      values.push(name);
      paramIndex++;
    }

    if (score !== undefined) {
      if (typeof score !== 'number') {
        return NextResponse.json(
          { error: 'Score must be a number' },
          { status: 400 }
        );
      }
      updateQuery += `score = $${paramIndex}, `;
      values.push(score);
      paramIndex++;
    }

    if (rank !== undefined) {
      if (typeof rank !== 'number') {
        return NextResponse.json(
          { error: 'Rank must be a number' },
          { status: 400 }
        );
      }
      updateQuery += `rank = $${paramIndex}, `;
      values.push(rank);
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
    values.push(playerId, roomId);

    const result = await query(updateQuery, values);

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating player:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Remove a player from a room
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; playerId: string }> }
) {
  try {
    const { roomId, playerId } = await params;

    // Verify player exists
    const playerCheck = await query(
      'SELECT id FROM players WHERE id = $1 AND room_id = $2',
      [playerId, roomId]
    );

    if (playerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Delete player
    await query('DELETE FROM players WHERE id = $1', [playerId]);

    return NextResponse.json(
      { message: 'Player removed successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error removing player:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
