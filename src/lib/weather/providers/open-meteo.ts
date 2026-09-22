import { CanonicalWeatherDataset, CanonicalHourlyItem, CanonicalDailyItem } from "../schema";
import { BaseWeatherProvider, GeoLocation } from "./base";
import { decodeWeatherCode, getWindDirectionLabel } from "../utils";
import { z } from "zod";

const GEOCODING_API_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_API_URL = "https://api.open-meteo.com/v1/forecast";

const PrimitiveArray = z.array(z.union([z.number(), z.string(), z.null()]));

const OpenMeteoResponseSchema = z.object({
  current: z.record(z.string(), z.union([z.number(), z.string(), z.null()])).optional(),
  hourly: z.record(z.string(), PrimitiveArray).optional(),
  daily: z.record(z.string(), PrimitiveArray).optional(),
}).passthrough();

type OpenMeteoResponse = z.infer<typeof OpenMeteoResponseSchema>;

export class OpenMeteoProvider implements BaseWeatherProvider {
  readonly providerName = "open_meteo";

  private async fetchWithRetry(url: string, maxRetries = 2): Promise<Response> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Next.js overrides native fetch, but we might want to bypass its internal cache
        // for weather since we use Redis, or we can use next: { revalidate: X }
        // For now, we will use default fetch behavior and manage cache via Upstash Redis.
        const res = await fetch(url, { cache: "no-store" });
        if (res.status === 429) {
          if (attempt < maxRetries) {
            const backoff = (attempt + 1) * 1500;
            console.warn(`[OPEN-METEO 429] Rate limited. Retrying in ${backoff}ms...`);
            await new Promise((r) => setTimeout(r, backoff));
            continue;
          } else {
            console.error("❌ [OPEN-METEO 429] Rate limit hit and max retries exceeded.");
            throw new Error("Open-Meteo Rate limit exceeded");
          }
        }
        if (!res.ok) {
          throw new Error(`Open-Meteo HTTP error: ${res.status} ${res.statusText}`);
        }
        return res;
      } catch (error) {
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        throw error;
      }
    }
    throw new Error("Request failed after retries");
  }

  async geocodeCity(cityName: string): Promise<GeoLocation | null> {
    console.info(`🌐 [PROVIDER CALL] Open-Meteo Geocode for '${cityName}'`);
    const url = `${GEOCODING_API_URL}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;

    try {
      const res = await this.fetchWithRetry(url);
      const data = await res.json();
      const results = data.results;
      if (results && results.length > 0) {
        const item = results[0];
        return {
          name: item.name,
          latitude: item.latitude,
          longitude: item.longitude,
          admin1: item.admin1 || "",
          country: item.country || "",
        };
      }
    } catch {
      console.warn(`⚠️ [OPEN-METEO] Failed to retrieve ${url}`);
    }

    // Fallback to Nominatim
    console.info(`🌐 [PROVIDER FALLBACK] Nominatim Geocode for '${cityName}'`);
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`;
    try {
      const res = await fetch(nominatimUrl, {
        headers: { "User-Agent": "WeatherGPTApp/1.0" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Nominatim fetch failed");
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        return {
          name: item.name || cityName,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          admin1: "",
          country: "",
        };
      }
    } catch (e) {
      console.error(`❌ [PROVIDER FALLBACK] Nominatim geocoding failed:`, e);
    }
    return null;
  }

  async fetchForecast(
    lat: number,
    lon: number,
    locationMeta: GeoLocation
  ): Promise<CanonicalWeatherDataset> {
    console.info(`🌐 [PROVIDER CALL] Open-Meteo GFS Forecast for (${lat}, ${lon})`);
    
    const url = new URL(FORECAST_API_URL);
    url.searchParams.set("latitude", lat.toString());
    url.searchParams.set("longitude", lon.toString());
    url.searchParams.set("models", "gfs_seamless");
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,pressure_msl,precipitation,cloud_cover,rain");
    url.searchParams.set("hourly", "temperature_2m,apparent_temperature,relative_humidity_2m,dew_point_2m,precipitation_probability,precipitation,weather_code,surface_pressure,pressure_msl,cloud_cover,visibility,wind_speed_10m,wind_gusts_10m,uv_index");
    url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,precipitation_hours,sunrise,sunset,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max");
    url.searchParams.set("timezone", "auto");

    const res = await this.fetchWithRetry(url.toString());
    const raw: unknown = await res.json();
    const validatedData = OpenMeteoResponseSchema.parse(raw);

    return this.normalize(validatedData, locationMeta);
  }

  private normalize(raw: OpenMeteoResponse, locMeta: GeoLocation): CanonicalWeatherDataset {
    const nowUtc = new Date();
    const nowIso = nowUtc.toISOString();

    const currRaw = raw.current ?? ({} as Record<string, string | number | null>);
    const hourlyRaw = raw.hourly ?? ({} as Record<string, (string | number | null)[]>);
    const dailyRaw = raw.daily ?? ({} as Record<string, (string | number | null)[]>);

    const wCode = Number(currRaw.weather_code ?? 0);
    const [condText, iconName] = decodeWeatherCode(wCode);
    const windDeg = Number(currRaw.wind_direction_10m ?? 0);

    const displayLoc = locMeta.admin1 && locMeta.admin1.toLowerCase() !== locMeta.name.toLowerCase() 
      ? `${locMeta.name}, ${locMeta.admin1}` 
      : locMeta.name;
    const finalDisplayLoc = locMeta.country && !displayLoc.includes(locMeta.country) 
      ? `${displayLoc}, ${locMeta.country}` 
      : displayLoc;

    const livePressure = Number(currRaw.pressure_msl ?? currRaw.surface_pressure ?? 1013.0);
    const dailyRains = dailyRaw.precipitation_probability_max || [];
    const currentPrecipProb = dailyRains.length > 0 ? Number(dailyRains[0]) : 20.0;
    const currTemp = Number(currRaw.temperature_2m ?? 25.0);
    const currFeels = Number(currRaw.apparent_temperature ?? currTemp);

    const currentWeather = {
      temperature_c: currTemp,
      feels_like_c: currFeels,
      humidity_pct: Number(currRaw.relative_humidity_2m ?? 60.0),
      dew_point_c: hourlyRaw.dew_point_2m ? Number(hourlyRaw.dew_point_2m[0]) : null,
      precipitation_mm: Number(currRaw.precipitation ?? 0.0),
      rain_mm: Number(currRaw.rain ?? 0.0),
      precipitation_probability: currentPrecipProb,
      rain_probability_pct: currentPrecipProb,
      wind_speed_kmh: Number(currRaw.wind_speed_10m ?? 10.0),
      wind_direction_deg: windDeg,
      wind_direction_label: getWindDirectionLabel(windDeg),
      wind_gusts_kmh: Number(currRaw.wind_gusts_10m ?? currRaw.wind_speed_10m ?? 10.0),
      cloud_cover_pct: Number(currRaw.cloud_cover ?? 40.0),
      pressure_hpa: livePressure,
      visibility_km: hourlyRaw.visibility ? Number(hourlyRaw.visibility[0]) / 1000.0 : 10.0,
      uv_index: dailyRaw.uv_index_max ? Number(dailyRaw.uv_index_max[0]) : 5.0,
      weather_code: wCode,
      condition: condText,
      icon: iconName,
    };

    const hourlyTimes = hourlyRaw.time || [];
    const hourlyItems: CanonicalHourlyItem[] = [];

    const currTimeStr = String(currRaw.time || "");
    let startIdx = 0;
    if (currTimeStr && hourlyTimes.length > 0) {
      const currPrefix = currTimeStr.substring(0, 13);
      startIdx = hourlyTimes.findIndex((t) => String(t).startsWith(currPrefix));
      if (startIdx === -1) {
        startIdx = hourlyTimes.findIndex((t) => String(t) >= currTimeStr);
        if (startIdx === -1) startIdx = 0;
      }
    }

    const endIdx = Math.min(hourlyTimes.length, startIdx + 24);
    for (let i = startIdx; i < endIdx; i++) {
      const offset = i - startIdx;
      const tStr = String(hourlyTimes[i]);
      let hourVal = i % 24;
      if (tStr.includes("T")) {
        hourVal = parseInt(tStr.split("T")[1].split(":")[0], 10);
      }
      const formattedTime = `${hourVal.toString().padStart(2, "0")}:00`;
      const hCode = hourlyRaw.weather_code ? Number(hourlyRaw.weather_code[i]) : 0;
      const [hCond, hIcon] = decodeWeatherCode(hCode);

      if (offset === 0) {
        hourlyItems.push({
          time: formattedTime,
          hour: hourVal,
          temperature_c: currentWeather.temperature_c,
          feels_like_c: currentWeather.feels_like_c,
          humidity_pct: currentWeather.humidity_pct,
          precipitation_mm: currentWeather.precipitation_mm,
          precipitation_probability: currentWeather.precipitation_probability,
          rain_probability_pct: currentWeather.rain_probability_pct,
          wind_speed_kmh: currentWeather.wind_speed_kmh,
          wind_direction_label: "N", // Keep simple as per python
          cloud_cover_pct: currentWeather.cloud_cover_pct,
          pressure_hpa: currentWeather.pressure_hpa,
          visibility_km: currentWeather.visibility_km,
          uv_index: currentWeather.uv_index,
          weather_code: currentWeather.weather_code,
          condition: currentWeather.condition,
          icon: currentWeather.icon,
        });
      } else {
        const hProb = hourlyRaw.precipitation_probability ? Number(hourlyRaw.precipitation_probability[i]) : 0.0;
        hourlyItems.push({
          time: formattedTime,
          hour: hourVal,
          temperature_c: hourlyRaw.temperature_2m ? Number(hourlyRaw.temperature_2m[i]) : currentWeather.temperature_c,
          feels_like_c: hourlyRaw.apparent_temperature ? Number(hourlyRaw.apparent_temperature[i]) : currentWeather.feels_like_c,
          humidity_pct: hourlyRaw.relative_humidity_2m ? Number(hourlyRaw.relative_humidity_2m[i]) : 60.0,
          precipitation_mm: hourlyRaw.precipitation ? Number(hourlyRaw.precipitation[i]) : 0.0,
          precipitation_probability: hProb,
          rain_probability_pct: hProb,
          wind_speed_kmh: hourlyRaw.wind_speed_10m ? Number(hourlyRaw.wind_speed_10m[i]) : 10.0,
          wind_direction_label: "N",
          cloud_cover_pct: hourlyRaw.cloud_cover ? Number(hourlyRaw.cloud_cover[i]) : 40.0,
          pressure_hpa: hourlyRaw.pressure_msl ? Number(hourlyRaw.pressure_msl[i]) : currentWeather.pressure_hpa,
          visibility_km: hourlyRaw.visibility ? Number(hourlyRaw.visibility[i]) / 1000.0 : 10.0,
          uv_index: hourlyRaw.uv_index ? Number(hourlyRaw.uv_index[i]) : 0.0,
          weather_code: hCode,
          condition: hCond,
          icon: hIcon,
        });
      }
    }

    const dailyTimes = dailyRaw.time || [];
    const dailyItems: CanonicalDailyItem[] = [];

    for (let i = 0; i < Math.min(7, dailyTimes.length); i++) {
      const dateStr = String(dailyTimes[i]);
      let dayName = `Day ${i + 1}`;
      let formattedDate = dateStr;
      try {
        const dObj = new Date(dateStr);
        if (!isNaN(dObj.getTime())) {
          dayName = i === 0 ? "Today" : dObj.toLocaleDateString("en-US", { weekday: "short" });
          formattedDate = dObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }
      } catch {
        // ignore
      }

      const dCode = dailyRaw.weather_code ? Number(dailyRaw.weather_code[i]) : 0;
      const [dCond, dIcon] = decodeWeatherCode(dCode);
      const dRainVal = dailyRaw.precipitation_probability_max ? Number(dailyRaw.precipitation_probability_max[i]) : 0.0;

      let sunriseStr = "06:00";
      let sunsetStr = "18:30";
      if (dailyRaw.sunrise && dailyRaw.sunrise[i] && String(dailyRaw.sunrise[i]).includes("T")) {
        sunriseStr = String(dailyRaw.sunrise[i]).split("T")[1].substring(0, 5);
      }
      if (dailyRaw.sunset && dailyRaw.sunset[i] && String(dailyRaw.sunset[i]).includes("T")) {
        sunsetStr = String(dailyRaw.sunset[i]).split("T")[1].substring(0, 5);
      }

      dailyItems.push({
        day: dayName,
        date: formattedDate,
        date_iso: dateStr,
        high_c: dailyRaw.temperature_2m_max ? Number(dailyRaw.temperature_2m_max[i]) : currentWeather.temperature_c,
        low_c: dailyRaw.temperature_2m_min ? Number(dailyRaw.temperature_2m_min[i]) : currentWeather.temperature_c - 5,
        condition: dCond,
        icon: dIcon,
        weather_code: dCode,
        daily_precipitation_probability: dRainVal,
        rain_probability_pct: dRainVal,
        precipitation_sum_mm: dailyRaw.precipitation_sum ? Number(dailyRaw.precipitation_sum[i]) : 0.0,
        wind_speed_max_kmh: dailyRaw.wind_speed_10m_max ? Number(dailyRaw.wind_speed_10m_max[i]) : 15.0,
        wind_gusts_max_kmh: dailyRaw.wind_gusts_10m_max ? Number(dailyRaw.wind_gusts_10m_max[i]) : 25.0,
        uv_index_max: dailyRaw.uv_index_max ? Number(dailyRaw.uv_index_max[i]) : 5.0,
        sunrise: sunriseStr,
        sunset: sunsetStr,
      });
    }

    return {
      location: {
        city: locMeta.name,
        display_location: finalDisplayLoc,
        region: locMeta.admin1 || "",
        country: locMeta.country || "",
        latitude: locMeta.latitude,
        longitude: locMeta.longitude,
      },
      current: currentWeather,
      hourly: hourlyItems,
      daily: dailyItems,
      freshness: {
        provider: this.providerName,
        nwp_source: "gfs_seamless",
        nwp_model: "NOAA GFS (Global Forecast System)",
        fetched_at: nowIso,
        observed_at: currRaw.time ? String(currRaw.time) : nowIso,
        stale: false,
        ttl_seconds: 900,
      },
    };
  }
}
