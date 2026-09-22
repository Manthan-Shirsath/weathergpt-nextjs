import { CanonicalWeatherDataset } from '../../weather/schema';
import { ExpertScenario, ScenarioEvidence } from '../types';

export function createBaseEvidence(
  scenario: ExpertScenario,
  location: { name: string; latitude: number; longitude: number }
): Omit<ScenarioEvidence, 'severity' | 'factors' | 'metrics' | 'recommendations' | 'limitations'> {
  return {
    scenarioId: scenario.id,
    domain: scenario.domain,
    location,
    assessedAt: new Date().toISOString(),
  };
}

export function getMaxPrecipitation(weather: CanonicalWeatherDataset) {
  let max = 0;
  for (const day of weather.daily) {
    if (day.precipitation_sum_mm > max) {
      max = day.precipitation_sum_mm;
    }
  }
  return max;
}

export function getMaxPrecipProb(weather: CanonicalWeatherDataset) {
  let max = 0;
  for (const day of weather.daily) {
    if (day.daily_precipitation_probability && day.daily_precipitation_probability > max) {
      max = day.daily_precipitation_probability;
    }
  }
  return max;
}
