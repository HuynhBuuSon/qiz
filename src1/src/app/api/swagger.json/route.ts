import { NextRequest, NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger';

export function GET(request: NextRequest) {
  return NextResponse.json(swaggerSpec);
}
