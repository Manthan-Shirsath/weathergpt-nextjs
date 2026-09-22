import { Redis } from '@upstash/redis';
import { getDb } from '../../db';
import { officialAlerts } from '../../db/schema';
import { ImdCapProvider } from './providers/imd';
import { Alert, ActiveAlertsResponse } from './schema';

const memoryCache = new Map<string, { data: ActiveAlertsResponse; expiresAt: number }>();

function getRedisClient(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return Redis.fromEnv();
    } catch {
      return null;
    }
  }
  return null;
}

export class AlertService {
  private static provider = new ImdCapProvider();
  private static CACHE_TTL = 300; // 5 minutes

  /**
   * Fetches the latest alerts from the provider and synchronizes them with Supabase.
   * Uses ON CONFLICT to prevent duplicates (deduplication based on externalId).
   */
  public static async syncAlerts(): Promise<void> {
    try {
      const rawAlerts = await this.provider.fetchAlerts();
      const db = getDb();

      for (const raw of rawAlerts) {
        await db.insert(officialAlerts).values({
          externalId: raw.externalId,
          source: raw.source,
          event: raw.event,
          severity: raw.severity,
          urgency: raw.urgency,
          certainty: raw.certainty,
          headline: raw.headline,
          description: raw.description,
          instruction: raw.instruction,
          areas: raw.areas,
          effectiveAt: raw.effectiveAt ? new Date(raw.effectiveAt) : undefined,
          expiresAt: raw.expiresAt ? new Date(raw.expiresAt) : undefined,
          sourceUrl: raw.sourceUrl,
          fetchedAt: new Date(),
          updatedAt: new Date(),
        }).onConflictDoUpdate({
          target: officialAlerts.externalId,
          set: {
            event: raw.event,
            severity: raw.severity,
            urgency: raw.urgency,
            certainty: raw.certainty,
            headline: raw.headline,
            description: raw.description,
            instruction: raw.instruction,
            areas: raw.areas,
            effectiveAt: raw.effectiveAt ? new Date(raw.effectiveAt) : undefined,
            expiresAt: raw.expiresAt ? new Date(raw.expiresAt) : undefined,
            sourceUrl: raw.sourceUrl,
            updatedAt: new Date(),
          }
        });
      }
    } catch (error) {
      console.warn('[AlertService] syncAlerts error:', error);
    }
  }

  /**
   * Retrieves active alerts for a given location, applying location matching logic.
   * Returns them in the Canonical Zod format.
   */
  public static async getActiveAlerts(location: string): Promise<ActiveAlertsResponse> {
    const cacheKey = `alerts:active:${location.toLowerCase()}`;

    // 1. Fast in-memory cache check
    const cachedMem = memoryCache.get(cacheKey);
    if (cachedMem && cachedMem.expiresAt > Date.now()) {
      return cachedMem.data;
    }

    // 2. Redis cache check (if configured)
    const redis = getRedisClient();
    if (redis) {
      try {
        const cached = await redis.get<ActiveAlertsResponse>(cacheKey);
        if (cached) {
          memoryCache.set(cacheKey, { data: cached, expiresAt: Date.now() + this.CACHE_TTL * 1000 });
          return cached;
        }
      } catch (err) {
        console.warn('[AlertService] Redis get failed:', err);
      }
    }

    try {
      // 3. Fetch from DB
      const now = new Date();
      let dbAlerts: (typeof officialAlerts.$inferSelect)[] = [];
      try {
        const db = getDb();
        dbAlerts = await db.select().from(officialAlerts);
      } catch (dbErr) {
        console.warn('[AlertService] DB query failed or table absent:', (dbErr as Error).message);
        const fallback: ActiveAlertsResponse = {
          status: 'no_official_alerts',
          alerts: [],
          fetchedAt: new Date().toISOString(),
        };
        memoryCache.set(cacheKey, { data: fallback, expiresAt: Date.now() + 60_000 });
        return fallback;
      }

      // 4. Filter Active & Match Location
      const activeAlerts: Alert[] = [];
      const locationLower = location.toLowerCase();

      for (const record of dbAlerts) {
        // Expiry check
        if (record.expiresAt && new Date(record.expiresAt) < now) {
          continue; // Expired
        }
        
        // If no expiry, consider it active if updated within the last 48 hours
        if (!record.expiresAt) {
          const hoursSinceUpdate = (now.getTime() - new Date(record.updatedAt).getTime()) / (1000 * 60 * 60);
          if (hoursSinceUpdate > 48) {
            continue; // Stale/Expired
          }
        }

        // Location match logic
        let matchLevel: 'exact' | 'regional' | 'state' | 'unknown' | null = null;
        const areas = record.areas as string[];

        // Try exact match on areas first
        if (areas.some(a => a.toLowerCase() === locationLower)) {
          matchLevel = 'state'; // In IMD, areas are mostly states. We label it 'state' match.
        } else if (record.description?.toLowerCase().includes(locationLower) || record.headline?.toLowerCase().includes(locationLower)) {
          matchLevel = 'regional'; // Mentioned in the description
        }

        if (matchLevel) {
          activeAlerts.push({
            id: record.id,
            externalId: record.externalId,
            source: record.source,
            event: record.event,
            severity: record.severity as Alert['severity'],
            urgency: record.urgency,
            certainty: record.certainty,
            headline: record.headline,
            description: record.description,
            instruction: record.instruction,
            areas: record.areas as string[],
            effectiveAt: record.effectiveAt?.toISOString(),
            expiresAt: record.expiresAt?.toISOString(),
            sourceUrl: record.sourceUrl,
            locationMatchLevel: matchLevel,
            fetchedAt: record.fetchedAt.toISOString(),
            updatedAt: record.updatedAt.toISOString(),
          });
        }
      }

      const response: ActiveAlertsResponse = {
        status: activeAlerts.length > 0 ? 'ready' : 'no_official_alerts',
        alerts: activeAlerts,
        fetchedAt: new Date().toISOString(),
      };

      // Save to memory cache
      memoryCache.set(cacheKey, { data: response, expiresAt: Date.now() + this.CACHE_TTL * 1000 });

      // Save to Redis if configured
      if (redis) {
        redis.set(cacheKey, JSON.stringify(response), { ex: this.CACHE_TTL }).catch(() => {});
      }

      return response;
    } catch (error) {
      console.error('[AlertService] Error retrieving active alerts:', error);
      return {
        status: 'unavailable',
        alerts: [],
        reason: 'internal_error',
      };
    }
  }
}
