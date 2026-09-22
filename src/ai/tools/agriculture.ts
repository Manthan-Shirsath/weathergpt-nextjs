import { tool, jsonSchema } from 'ai';
import { weatherService } from '@/lib/weather/service';

type AgricultureArgs = { location: string; crop?: string };

export const getAgricultureAdviceTool = tool({
  description: 'Evaluates agricultural conditions for a location based on current weather data. NOTE: This is currently a temporary rule-based heuristic approximation. The full SkyCast Agriculture Intelligence service is deferred to a future phase.',
  inputSchema: jsonSchema<AgricultureArgs>({
    type: 'object',
    properties: {
      location: { type: 'string', description: 'The location to evaluate farming conditions for' },
      crop: { type: 'string', description: 'The specific crop being grown (e.g. "Wheat", "Cotton")' }
    },
    required: ['location']
  }),
  execute: async ({ location, crop }: AgricultureArgs) => {
    
    try {
      const data = await weatherService.getWeatherForCity(location);
      const current = data.current;
      const today = data.daily[0];

      // Spraying conditions: High wind or rain makes it unsuitable
      const isWindy = current.wind_speed_kmh > 15;
      const isRainy = current.precipitation_mm > 1 || today.precipitation_sum_mm > 5;
      const canSpray = !isWindy && !isRainy;

      // Irrigation: if rained heavily or raining, no need to irrigate
      const needsIrrigation = today.precipitation_sum_mm < 2 && current.temperature_c > 30;

      return {
        location: data.location.city,
        target_crop: crop || 'General Agriculture',
        current_temperature: current.temperature_c,
        current_wind_speed: current.wind_speed_kmh,
        daily_rainfall_mm: today.precipitation_sum_mm,
        advisories: {
          spraying: {
            suitable: canSpray,
            reason: canSpray ? 'Optimal wind and dry conditions.' : (isWindy ? 'Wind speed too high, risk of drift.' : 'Rain expected, chemicals may wash off.')
          },
          irrigation: {
            recommended: needsIrrigation,
            reason: needsIrrigation ? 'High temperatures and low rainfall expected.' : 'Sufficient moisture from recent/expected rain.'
          }
        },
        architecture_status: "UNAVAILABLE_DEFERRED",
        disclaimer: "These are basic threshold-based estimates. The full SkyCast Agriculture Intelligence integration has not yet been migrated and is unavailable."
      };
    } catch (error) {
      return {
        error: `Could not evaluate agricultural conditions for ${location}: ${(error as Error).message}`
      };
    }
  }
});
