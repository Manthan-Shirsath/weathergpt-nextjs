import { ExpertScenario, ScenarioEvidence, ScenarioAnalyzer } from '../types';
import { createBaseEvidence, getMaxPrecipitation } from './utils';

export const analyzeGeneral: ScenarioAnalyzer = (scenario, weather, location) => {
  const base = createBaseEvidence(scenario, location);
  
  if (scenario.id === 'general-personal-briefing') {
    const maxTemp = Math.max(...weather.daily.map(d => d.high_c));
    const minTemp = Math.min(...weather.daily.map(d => d.low_c));
    const isRainingNow = weather.current.precipitation_mm > 0;
    const maxPrecip = getMaxPrecipitation(weather);
    
    let severity: ScenarioEvidence['severity'] = 'LOW';
    if (maxPrecip > 20 || maxTemp > 35 || minTemp < 5) severity = 'ELEVATED';
    
    return {
      ...base,
      severity,
      confidence: 'HIGH',
      factors: [
        { name: 'Current Weather', value: `${weather.current.temperature_c}°C`, interpretation: isRainingNow ? 'Precipitating' : 'Clear' },
        { name: 'Today\'s Extremes', value: `${minTemp}°C - ${maxTemp}°C`, interpretation: 'Daily Range' }
      ],
      metrics: [
        { name: 'current_temp', value: weather.current.temperature_c, unit: '°C' },
        { name: 'daily_max', value: maxTemp, unit: '°C' },
        { name: 'daily_min', value: minTemp, unit: '°C' }
      ],
      recommendations: isRainingNow || maxPrecip > 0 ? ['Carry an umbrella'] : ['Enjoy the weather'],
      limitations: []
    };
  }
  
  throw new Error(`Unknown scenario: ${scenario.id}`);
};
