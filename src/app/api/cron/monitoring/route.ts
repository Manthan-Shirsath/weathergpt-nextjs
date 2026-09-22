import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '../../../../lib/monitoring/service';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const LOCK_KEY = 'cron:monitoring:lock';
const LOCK_TTL_SECONDS = 60; // 1 minute

export async function GET(request: NextRequest) {
  // 1. Authenticate Request
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Acquire Redis Lock (Idempotency)
  const acquired = await redis.set(LOCK_KEY, 'locked', { nx: true, ex: LOCK_TTL_SECONDS });
  if (!acquired) {
    return NextResponse.json({ status: 'skipped', reason: 'already_running' }, { status: 200 });
  }

  try {
    // 3. Execute Job
    await MonitoringService.evaluateMonitors();
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('[Cron/Monitoring] Error during execution:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    // 4. Release Lock
    await redis.del(LOCK_KEY);
  }
}
