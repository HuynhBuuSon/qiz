import { NextRequest } from 'next/server';

// This is a placeholder - Socket.IO requires a special setup
// The actual WebSocket server needs to be implemented in a separate Node.js server
// or using a library that supports Next.js WebSocket

export async function GET(req: NextRequest) {
  return new Response(
    JSON.stringify({
      message: 'WebSocket endpoint - connect via socket.io-client',
    }),
    { status: 200 }
  );
}
