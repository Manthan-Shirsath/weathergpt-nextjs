import { ExpertScenario, ScenarioEvidence, ScenarioAnalyzer } from '../types';
import { createBaseEvidence, getMaxPrecipitation } from './utils';

export const analyzeUrban: ScenarioAnalyzer = (scenario, weather, location) => {
  const base = createBaseEvidence(scenario, location);
  
  if (scenario.id === 'urban-rain-impact') {
    const maxPrecip = getMaxPrecipitation(weather);
    const severity: ScenarioEvidence['severity'] = maxPrecip > 30 ? 'HIGH' : (maxPrecip > 10 ? 'ELEVATED' : 'LOW');
    
    return {
      ...base,
      severity,
      confidence: 'HIGH',
      factors: [
        { name: 'Rainfall Impact', value: `${maxPrecip} mm`, interpretation: severity }
      ],
      metrics: [{ name: 'precipitation', value: maxPrecip, unit: 'mm' }],
      recommendations: maxPrecip > 30 ? ['Expect urban waterlogging', 'Avoid underpasses and known flood spots'] : ['Normal urban conditions'],
      limitations: ['Specific drainage capacity unknown']
    };
  }

  if (scenario.id === 'urban-mobility-risk') {
    const isRainingNow = weather.current.precipitation_mm > 0;
    const isThunderstorm = [95, 96, 99].includes(weather.current.weather_code);
    const severity: ScenarioEvidence['severity'] = (isRainingNow || isThunderstorm) ? 'ELEVATED' : 'LOW';
    
    return {
      ...base,
      severity,
      confidence: 'MODERATE',
      factors: [
        { name: 'Current Precipitation', value: `${weather.current.precipitation_mm} mm`, interpretation: isRainingNow ? 'Active' : 'Clear' }
      ],
      metrics: [{ name: 'current_precipitation', value: weather.current.precipitation_mm, unit: 'mm' }],
      recommendations: severity === 'ELEVATED' ? ['Expect slower traffic', 'Allow extra commute time'] : ['Normal travel conditions expected'],
      limitations: ['Real-time traffic data unavailable']
    };
  }
  throw new Error(`Unknown scenario: ${scenario.id}`);
};
