import { ExpertScenario, ScenarioEvidence, ScenarioAnalyzer } from '../types';
import { createBaseEvidence } from './utils';

export const analyzeMarine: ScenarioAnalyzer = (scenario, weather, location) => {
  const base = createBaseEvidence(scenario, location);
  
  if (scenario.id === 'marine-conditions') {
    const maxWind = Math.max(...weather.hourly.slice(0, 12).map(h => h.wind_speed_kmh));
    const severity: ScenarioEvidence['severity'] = maxWind > 30 ? 'HIGH' : maxWind > 20 ? 'ELEVATED' : 'LOW';
    
    return {
      ...base,
      severity,
      confidence: 'MODERATE',
      factors: [
        { name: 'Surface Wind', value: `${maxWind} km/h`, interpretation: severity }
      ],
      metrics: [{ name: 'wind_speed', value: maxWind, unit: 'km/h' }],
      recommendations: maxWind > 20 ? ['Small vessels should exercise caution'] : ['Conditions appear favorable for small vessels'],
      limitations: ['Wave and swell data are not available']
    };
  }
  
  if (scenario.id === 'marine-change-risk') {
    const currentWind = weather.current.wind_speed_kmh;
    const maxFutureWind = Math.max(...weather.hourly.slice(0, 12).map(h => h.wind_speed_kmh));
    const deterioration = maxFutureWind - currentWind;
    
    const severity: ScenarioEvidence['severity'] = deterioration > 15 ? 'ELEVATED' : 'LOW';
    
    return {
      ...base,
      severity,
      confidence: 'MODERATE',
      factors: [
        { name: 'Expected Wind Increase', value: `+${deterioration} km/h`, interpretation: deterioration > 15 ? 'Significant Deterioration' : 'Stable' }
      ],
      metrics: [{ name: 'wind_increase', value: deterioration, unit: 'km/h' }],
      recommendations: deterioration > 15 ? ['Monitor conditions closely if remaining out for several hours'] : [],
      limitations: []
    };
  }
  throw new Error(`Unknown scenario: ${scenario.id}`);
};
