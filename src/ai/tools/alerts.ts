import { tool, jsonSchema } from 'ai';
import { weatherService } from '@/lib/weather/service';
import { AlertService } from '@/lib/alerts/service';

type AlertsArgs = { location: string };

export const getOfficialAlertsTool = tool({
  description: 'Retrieves official weather alerts and warnings (e.g. from IMD) for a specific location. Use this when a user asks about warnings, alerts, or official hazards.',
  inputSchema: jsonSchema<AlertsArgs>({
    type: 'object',
    properties: {
      location: { type: 'string', description: 'The location to check official alerts for' }
    },
    required: ['location']
  }),
  execute: async ({ location }: AlertsArgs) => {
    try {
      const response = await AlertService.getActiveAlerts(location);
      return response;
    } catch (error) {
      return {
        status: 'error',
        error: `Could not fetch official alerts for ${location}: ${(error as Error).message}`
      };
    }
  }
});

export const getWeatherRiskTool = tool({
  description: 'Evaluates weather risks (e.g. heavy rain, extreme heat, high winds) based on WeatherGPT threshold analysis. This provides a computed risk estimate, not an official government warning. Use this if official alerts are unavailable or to augment official warnings with local computed estimates.',
  inputSchema: jsonSchema<AlertsArgs>({
    type: 'object',
    properties: {
      location: { type: 'string', description: 'The location to assess computed weather risks for' }
    },
    required: ['location']
  }),
  execute: async ({ location }: AlertsArgs) => {
    try {
      const data = await weatherService.getWeatherForCity(location);
      
      const risks = [];
      const current = data.current;
      const today = data.daily[0];

      // Heatwave risk
      if (current.temperature_c >= 40 || today.high_c >= 40) {
        risks.push({
          hazard: 'Heatwave',
          level: 'SEVERE',
          description: `Extreme heat detected. Current: ${current.temperature_c}°C, High: ${today.high_c}°C`
        });
      } else if (current.temperature_c >= 35 || today.high_c >= 35) {
        risks.push({
          hazard: 'High Heat',
          level: 'MODERATE',
          description: 'Temperatures are very high, limit outdoor activity.'
        });
      }

      // Flood / Rain risk
      if (today.precipitation_sum_mm >= 50) {
        risks.push({
          hazard: 'Heavy Rain / Flash Flood',
          level: 'SEVERE',
          description: `Extreme rainfall expected today: ${today.precipitation_sum_mm}mm.`
        });
      } else if (today.precipitation_sum_mm >= 20) {
        risks.push({
          hazard: 'Moderate Rain',
          level: 'MODERATE',
          description: `Significant rainfall expected: ${today.precipitation_sum_mm}mm.`
        });
      }

      // Wind risk
      if (current.wind_speed_kmh >= 60 || today.wind_speed_max_kmh >= 60) {
        risks.push({
          hazard: 'High Winds',
          level: 'SEVERE',
          description: `Dangerous wind gusts up to ${Math.max(current.wind_speed_kmh, today.wind_speed_max_kmh)} km/h.`
        });
      }

      return {
        location: data.location.city,
        overall_status: risks.length > 0 ? (risks.some(r => r.level === 'SEVERE') ? 'CRITICAL' : 'WARNING') : 'SAFE',
        risks,
        message: risks.length > 0 ? 'Hazards detected.' : 'No severe weather hazards detected based on current data.',
        type: 'computed_risk',
        disclaimer: "These alerts are generated locally via simple weather thresholds. This is NOT an official IMD warning."
      };
    } catch (error) {
      return {
        error: `Could not evaluate risk for ${location}: ${(error as Error).message}`
      };
    }
  }
});
