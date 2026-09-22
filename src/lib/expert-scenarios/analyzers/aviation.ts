import { ExpertScenario, ScenarioEvidence, ScenarioAnalyzer } from '../types';
import { createBaseEvidence } from './utils';

export const analyzeAviation: ScenarioAnalyzer = (scenario, weather, location) => {
  const base = createBaseEvidence(scenario, location);
  
  if (scenario.id === 'aviation-turbulence-risk' || scenario.id === 'aviation-flight-impact') {
    const maxWind = Math.max(...weather.hourly.map(h => h.wind_speed_kmh));
    const severity: ScenarioEvidence['severity'] = maxWind > 50 ? 'HIGH' : (maxWind > 30 ? 'ELEVATED' : 'LOW');
    
    return {
      ...base,
      severity,
      confidence: 'MODERATE',
      factors: [
        { name: 'Wind Speed', value: `${maxWind} km/h`, interpretation: maxWind > 40 ? 'High' : 'Normal' }
      ],
      metrics: [{ name: 'wind_speed_max', value: maxWind, unit: 'km/h' }],
      recommendations: ['Monitor crosswinds during landing/takeoff', 'Check precise METAR/TAF before flight'],
      limitations: ['Visibility and cloud ceiling data unavailable', 'Does not replace official flight dispatch']
    };
  }

  if (scenario.id === 'aviation-convective-assessment') {
    const isThunderstorm = [95, 96, 99].includes(weather.current.weather_code);
    const severity: ScenarioEvidence['severity'] = isThunderstorm ? 'HIGH' : 'LOW';
    
    return {
      ...base,
      severity,
      confidence: 'HIGH',
      factors: [
        { name: 'Convective Activity', value: isThunderstorm ? 'Present' : 'Clear', interpretation: isThunderstorm ? 'Hazardous' : 'Safe' }
      ],
      metrics: [],
      recommendations: isThunderstorm ? ['Expect reroutes around convective cells', 'Anticipate turbulence'] : [],
      limitations: ['Does not replace radar/SIGMET data']
    };
  }
  throw new Error(`Unknown scenario: ${scenario.id}`);
};
