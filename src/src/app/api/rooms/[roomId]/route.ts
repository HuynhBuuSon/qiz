import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/config';

// Get room by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    const result = await query(
      'SELECT * FROM game_rooms WHERE id = $1',
      [roomId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Update room (colors, settings)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { colorFrom, colorTo, mainColor } = body;

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

    // Build update query
    let updateQuery = 'UPDATE game_rooms SET ';
    const values: any[] = [];
    let paramIndex = 1;

    if (mainColor !== undefined) {
      updateQuery += `main_color = $${paramIndex}, `;
      values.push(mainColor);
      paramIndex++;
    }

    if (colorFrom !== undefined) {
      updateQuery += `color_from = $${paramIndex}, `;
      values.push(colorFrom);
      paramIndex++;
    }

    if (colorTo !== undefined) {
      updateQuery += `color_to = $${paramIndex}, `;
      values.push(colorTo);
      paramIndex++;
    }

    if (values.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Remove trailing comma and space
    updateQuery = updateQuery.replace(/,\s*$/, ' ');
    updateQuery += `WHERE id = $${paramIndex} RETURNING *`;
    values.push(roomId);

    const result = await query(updateQuery, values);

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
