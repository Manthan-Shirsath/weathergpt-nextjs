import { tool, jsonSchema } from 'ai';
import { weatherService } from '@/lib/weather/service';

type CurrentWeatherArgs = { location: string };

export const getCurrentWeatherTool = tool({
  description: 'Retrieves current weather conditions for a specified location.',
  inputSchema: jsonSchema<CurrentWeatherArgs>({
    type: 'object',
    properties: {
      location: { type: 'string', description: 'The location to get weather for (e.g. "Pune", "Mumbai")' }
    },
    required: ['location']
  }),
  execute: async ({ location }: CurrentWeatherArgs) => {
    
    try {
      const data = await weatherService.getWeatherForCity(location);
      
      return {
        location: data.location.city,
        temperature_c: data.current.temperature_c,
        feels_like_c: data.current.feels_like_c,
        condition: data.current.condition,
        humidity_pct: data.current.humidity_pct,
        precipitation_mm: data.current.precipitation_mm,
        wind_speed_kmh: data.current.wind_speed_kmh,
        wind_direction: data.current.wind_direction_deg,
        pressure_hpa: data.current.pressure_hpa,
        stale: data.freshness.stale,
        observed_at: data.freshness.fetched_at,
        source: 'skycast_weather_service'
      };
    } catch (error) {
      return {
        error: `Could not retrieve current weather for ${location}: ${(error as Error).message}`
      };
    }
  }
});

type ForecastArgs = { location: string; days?: number; date?: string };

export const getForecastTool = tool({
  description: 'Retrieves hourly and daily forecast projections for a location.',
  inputSchema: jsonSchema<ForecastArgs>({
    type: 'object',
    properties: {
      location: { type: 'string', description: 'The location to get the forecast for' },
      days: { type: 'number', description: 'Number of days to forecast (default 5, max 7)' },
      date: { type: 'string', description: 'Target ISO date string (YYYY-MM-DD)' }
    },
    required: ['location']
  }),
  execute: async ({ location, days = 5, date }: ForecastArgs) => {
    
    try {
      const data = await weatherService.getWeatherForCity(location);
      
      // We limit to the requested days
      const daysLimit = Math.max(1, Math.min(7, days));
      const dailySummary = data.daily.slice(0, daysLimit).map(d => ({
        date: d.date,
        high_c: d.high_c,
        low_c: d.low_c,
        condition: d.condition,
        precipitation_probability: d.daily_precipitation_probability,
        precipitation_sum_mm: d.precipitation_sum_mm,
        wind_speed_max_kmh: d.wind_speed_max_kmh
      }));

      // Find the specific daily item if date is requested
      let targetDaily = null;
      if (date) {
        targetDaily = dailySummary.find(d => d.date.startsWith(date));
      }

      // Format next 12 hours from current time or from start of target date
      let hourlyTarget = data.hourly;
      if (date) {
        hourlyTarget = data.hourly.filter(h => h.time.startsWith(date));
      }
      
      const hourlySummary = hourlyTarget.slice(0, 12).map(h => ({
        time: h.time,
        temperature_c: h.temperature_c,
        feels_like_c: h.feels_like_c,
        condition: h.condition,
        precipitation_probability: h.precipitation_probability
      }));

      return {
        location: data.location.city,
        target_date: date || dailySummary[0]?.date,
        day_forecast: targetDaily || dailySummary[0],
        daily_forecast: dailySummary,
        hourly_forecast: hourlySummary,
        stale: data.freshness.stale,
        source: 'skycast_weather_service'
      };
    } catch (error) {
      return {
        error: `Could not retrieve forecast for ${location}: ${(error as Error).message}`
      };
    }
  }
});
