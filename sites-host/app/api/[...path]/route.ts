import { env } from 'cloudflare:workers';
import { serve } from '../../../game/src/sites/rooms';
import { D1Store } from '../../../game/src/sites/d1-store';

export const dynamic = 'force-dynamic';
function handle(request: Request) {
  if (!env.DB) return Response.json({ detail: '接続準備中です。' }, { status: 503 });
  return serve(request, new D1Store(env.DB.withSession('first-primary')));
}
export const GET = handle;
export const POST = handle;
