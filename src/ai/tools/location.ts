import { tool, jsonSchema } from 'ai';

type LocationArgs = { query: string };

export const searchLocationTool = tool({
  description: 'Resolves a natural language location into normalized coordinates & metadata. Always use this first if you do not have lat/lon for a location.',
  inputSchema: jsonSchema<LocationArgs>({
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The name of the location to search for (e.g. "Pune", "Dadar")' }
    },
    required: ['query']
  }),
  execute: async ({ query }: LocationArgs) => {
    
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch location data: ${response.statusText}`);
      }
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return {
          found: false,
          message: `Could not find geographic coordinates for '${query}'.`
        };
      }
      
      const result = data.results[0];
      return {
        found: true,
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude,
        region: result.admin1 || '',
        country: result.country || '',
        timezone: result.timezone || 'auto'
      };
    } catch (error) {
      return {
        found: false,
        message: `Error resolving location: ${(error as Error).message}`
      };
    }
  }
});
