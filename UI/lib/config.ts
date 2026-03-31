// REST calls use a relative path — Next.js rewrites proxy them to the Go API.
// WS must be an absolute ws:// URL since it is opened directly by the browser.
const WS_URL_RAW = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

export const API_URL = '';


// WebSocket base URL — always ws:// or wss://
export const WS_URL = WS_URL_RAW.replace(/^https/, 'wss').replace(/^http/, 'ws').replace(/\/$/, '');
