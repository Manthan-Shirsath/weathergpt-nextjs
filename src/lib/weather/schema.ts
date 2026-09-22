import { z } from "zod";

export const CanonicalLocationMetaSchema = z.object({
  city: z.string(),
  display_location: z.string(),
  region: z.string(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export const CanonicalCurrentWeatherSchema = z.object({
  temperature_c: z.number(),
  feels_like_c: z.number(),
  humidity_pct: z.number(),
  dew_point_c: z.number().nullable().optional(),
  precipitation_mm: z.number(),
  rain_mm: z.number(),
  precipitation_probability: z.number(),
  rain_probability_pct: z.number(),
  wind_speed_kmh: z.number(),
  wind_direction_deg: z.number(),
  wind_direction_label: z.string(),
  wind_gusts_kmh: z.number(),
  cloud_cover_pct: z.number(),
  pressure_hpa: z.number(),
  visibility_km: z.number(),
  uv_index: z.number(),
  weather_code: z.number(),
  condition: z.string(),
  icon: z.string(),
});

export const CanonicalHourlyItemSchema = z.object({
  time: z.string(),
  hour: z.number(),
  temperature_c: z.number(),
  feels_like_c: z.number(),
  humidity_pct: z.number(),
  precipitation_mm: z.number(),
  precipitation_probability: z.number(),
  rain_probability_pct: z.number(),
  wind_speed_kmh: z.number(),
  wind_direction_label: z.string(),
  cloud_cover_pct: z.number(),
  pressure_hpa: z.number(),
  visibility_km: z.number(),
  uv_index: z.number(),
  weather_code: z.number(),
  condition: z.string(),
  icon: z.string(),
});

export const CanonicalDailyItemSchema = z.object({
  day: z.string(),
  date: z.string(),
  date_iso: z.string(),
  high_c: z.number(),
  low_c: z.number(),
  condition: z.string(),
  icon: z.string(),
  weather_code: z.number(),
  daily_precipitation_probability: z.number(),
  rain_probability_pct: z.number(),
  precipitation_sum_mm: z.number(),
  wind_speed_max_kmh: z.number(),
  wind_gusts_max_kmh: z.number(),
  uv_index_max: z.number(),
  sunrise: z.string(),
  sunset: z.string(),
});

export const CanonicalFreshnessMetaSchema = z.object({
  provider: z.string(),
  nwp_source: z.string(),
  nwp_model: z.string(),
  fetched_at: z.string(), // ISO string
  observed_at: z.string(), // ISO string
  stale: z.boolean(),
  ttl_seconds: z.number(),
});

export const CanonicalWeatherDatasetSchema = z.object({
  location: CanonicalLocationMetaSchema,
  current: CanonicalCurrentWeatherSchema,
  hourly: z.array(CanonicalHourlyItemSchema),
  daily: z.array(CanonicalDailyItemSchema),
  freshness: CanonicalFreshnessMetaSchema,
});

export type CanonicalLocationMeta = z.infer<typeof CanonicalLocationMetaSchema>;
export type CanonicalCurrentWeather = z.infer<typeof CanonicalCurrentWeatherSchema>;
export type CanonicalHourlyItem = z.infer<typeof CanonicalHourlyItemSchema>;
export type CanonicalDailyItem = z.infer<typeof CanonicalDailyItemSchema>;
export type CanonicalFreshnessMeta = z.infer<typeof CanonicalFreshnessMetaSchema>;
export type CanonicalWeatherDataset = z.infer<typeof CanonicalWeatherDatasetSchema>;
