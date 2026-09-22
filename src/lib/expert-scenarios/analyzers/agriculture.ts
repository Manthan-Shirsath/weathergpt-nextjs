import { ExpertScenario, ScenarioEvidence, ScenarioAnalyzer } from '../types';
import { createBaseEvidence, getMaxPrecipitation, getMaxPrecipProb } from './utils';

export const analyzeAgriculture: ScenarioAnalyzer = (scenario, weather, location) => {
  const base = createBaseEvidence(scenario, location);
  
  if (scenario.id === 'agriculture-rain-advisory') {
    const maxPrecip = getMaxPrecipitation(weather);
    const severity: ScenarioEvidence['severity'] = maxPrecip > 20 ? 'ELEVATED' : 'LOW';
    
    return {
      ...base,
      severity,
      confidence: 'HIGH',
      factors: [
        { name: 'Rainfall Amount', value: `${maxPrecip} mm`, interpretation: maxPrecip > 20 ? 'Significant' : 'Manageable' }
      ],
      metrics: [{ name: 'precipitation', value: maxPrecip, unit: 'mm' }],
      recommendations: maxPrecip > 20 ? ['Ensure field drainage is clear', 'Delay spraying operations'] : ['Standard operations can proceed'],
      limitations: ['Crop specific thresholds are not known']
    };
  }

  if (scenario.id === 'agriculture-stress-assessment') {
    const maxTemp = Math.max(...weather.daily.map(d => d.high_c));
    const severity: ScenarioEvidence['severity'] = maxTemp > 35 ? 'HIGH' : 'LOW';
    
    return {
      ...base,
      severity,
      confidence: 'HIGH',
      factors: [
        { name: 'Max Temperature', value: `${maxTemp}°C`, interpretation: maxTemp > 35 ? 'Heat Stress' : 'Favorable' }
      ],
      metrics: [{ name: 'temperature_max', value: maxTemp, unit: '°C' }],
      recommendations: maxTemp > 35 ? ['Increase irrigation frequency', 'Monitor for heat damage'] : [],
      limitations: ['Soil moisture data unavailable']
    };
  }
  throw new Error(`Unknown scenario: ${scenario.id}`);
};
