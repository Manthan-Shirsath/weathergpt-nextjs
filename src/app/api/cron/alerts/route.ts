import { NextRequest, NextResponse } from 'next/server';
import { AlertService } from '../../../../lib/alerts/service';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const LOCK_KEY = 'cron:alerts:lock';
const LOCK_TTL_SECONDS = 120; // 2 minutes

export async function GET(request: NextRequest) {
  // 1. Authenticate Request
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Acquire Redis Lock (Idempotency)
  // NX: Set only if it doesn't exist. EX: Expire after 120s
  const acquired = await redis.set(LOCK_KEY, 'locked', { nx: true, ex: LOCK_TTL_SECONDS });
  if (!acquired) {
    return NextResponse.json({ status: 'skipped', reason: 'already_running' }, { status: 200 });
  }

  try {
    // 3. Execute Job
    await AlertService.syncAlerts();
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('[Cron/Alerts] Error during execution:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    // 4. Release Lock
    await redis.del(LOCK_KEY);
  }
}
