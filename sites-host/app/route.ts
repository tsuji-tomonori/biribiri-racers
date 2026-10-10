import { gameHtml } from '../lib/game-html';
export function GET() {
  return new Response(gameHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' } });
}
