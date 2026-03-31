const API_URL_RAW = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const WS_URL_RAW = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

// Base URL for all REST API calls (no trailing slash)
export const API_URL = API_URL_RAW.replace(/\/$/, '');

// WebSocket base URL — always ws:// or wss://
export const WS_URL = WS_URL_RAW.replace(/^https/, 'wss').replace(/^http/, 'ws').replace(/\/$/, '');
