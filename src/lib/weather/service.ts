import { CanonicalWeatherDataset, CanonicalWeatherDatasetSchema } from "./schema";
import { BaseWeatherProvider } from "./providers/base";
import { OpenMeteoProvider } from "./providers/open-meteo";
import { redis } from "../redis";

const TTL_CURRENT_WEATHER = 900; // 15 mins
const TTL_STALE_RETENTION = 86400; // 24 hours

export class WeatherService {
  private provider: BaseWeatherProvider;

  constructor(provider?: BaseWeatherProvider) {
    this.provider = provider || new OpenMeteoProvider();
  }

  private getCoordCacheKey(lat: number, lon: number): string {
    return `weather:coord:${lat.toFixed(4)},${lon.toFixed(4)}`;
  }

  private getCityCacheKey(cityName: string): string {
    const cleanCity = cityName.trim().toLowerCase();
    return `weather:city:${cleanCity}`;
  }

  private isCacheFresh(dataset: CanonicalWeatherDataset): boolean {
    const fetchedAt = new Date(dataset.freshness.fetched_at).getTime();
    const now = Date.now();
    const ageSeconds = (now - fetchedAt) / 1000;
    return ageSeconds < dataset.freshness.ttl_seconds;
  }

  async getWeather(latitude: number, longitude: number, forceRefresh = false, locationFallback?: { name?: string, timezone?: string }): Promise<CanonicalWeatherDataset> {
    const cacheKey = this.getCoordCacheKey(latitude, longitude);
    let cachedDataset: CanonicalWeatherDataset | null = null;

    if (redis) {
      try {
        const rawCached = await redis.get(cacheKey);
        if (rawCached) {
          const parsed = CanonicalWeatherDatasetSchema.safeParse(rawCached);
          if (parsed.success) {
            cachedDataset = parsed.data;
          } else {
            console.warn(`⚠️ [CACHE WARNING] Invalid schema in cache for ${cacheKey}.`);
          }
        }
      } catch (e) {
        console.error(`⚠️ [REDIS ERROR] Failed to get cache for ${cacheKey}`, e);
      }
    }

    if (cachedDataset && !forceRefresh) {
      if (this.isCacheFresh(cachedDataset)) {
        return cachedDataset;
      }
    }

    try {
      const geoLoc = {
        latitude,
        longitude,
        name: locationFallback?.name || `Lat ${latitude.toFixed(2)}, Lon ${longitude.toFixed(2)}`,
        timezone: locationFallback?.timezone
      };

      const dataset = await this.provider.fetchForecast(latitude, longitude, geoLoc);
      dataset.freshness.ttl_seconds = TTL_CURRENT_WEATHER;

      const validated = CanonicalWeatherDatasetSchema.parse(dataset);

      if (redis) {
        try {
          await redis.set(cacheKey, validated, { ex: TTL_STALE_RETENTION });
        } catch (e) {
          console.error(`⚠️ [REDIS ERROR] Failed to set cache for ${cacheKey}`, e);
        }
      }

      return validated;
    } catch (error) {
      console.error(`❌ [HUB ERROR] Failed ingesting weather for coords ${latitude},${longitude}:`, error);
      if (cachedDataset) {
        console.warn(`⚠️ [STALE CACHE] Returning stale data for coords ${latitude},${longitude}`);
        cachedDataset.freshness.stale = true;
        return cachedDataset;
      }
      throw error;
    }
  }

  async getWeatherForCity(cityName: string, forceRefresh = false): Promise<CanonicalWeatherDataset> {
    const cacheKey = this.getCityCacheKey(cityName);
    let cachedDataset: CanonicalWeatherDataset | null = null;

    if (redis) {
      try {
        const rawCached = await redis.get(cacheKey);
        if (rawCached) {
          const parsed = CanonicalWeatherDatasetSchema.safeParse(rawCached);
          if (parsed.success) {
            cachedDataset = parsed.data;
          }
        }
      } catch {
        // ignore
      }
    }

    if (cachedDataset && !forceRefresh && this.isCacheFresh(cachedDataset)) {
      return cachedDataset;
    }

    try {
      const geo = await this.provider.geocodeCity(cityName);
      if (!geo) {
        throw new Error(`Location '${cityName}' not found.`);
      }

      const validated = await this.getWeather(geo.latitude, geo.longitude, forceRefresh, geo);

      if (redis) {
        try {
          await redis.set(cacheKey, validated, { ex: TTL_STALE_RETENTION });
        } catch {}
      }

      return validated;
    } catch (error) {
      console.error(`❌ [HUB ERROR] Failed geocoding or fetching weather for ${cityName}:`, error);
      if (cachedDataset) {
        console.warn(`⚠️ [STALE CACHE] Returning stale data for city ${cityName}`);
        cachedDataset.freshness.stale = true;
        return cachedDataset;
      }
      throw error;
    }
  }
}

export const weatherService = new WeatherService();
