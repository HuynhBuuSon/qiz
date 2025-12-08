import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/config';

// Get room by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await query(
      'SELECT * FROM game_rooms WHERE id = $1',
      [id]
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
