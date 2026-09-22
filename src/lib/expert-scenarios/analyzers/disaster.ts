import { ExpertScenario, ScenarioEvidence, ScenarioAnalyzer } from '../types';
import { CanonicalWeatherDataset } from '../../weather/schema';
import { createBaseEvidence, getMaxPrecipitation, getMaxPrecipProb } from './utils';

export const analyzeDisaster: ScenarioAnalyzer = (scenario, weather, location) => {
  const base = createBaseEvidence(scenario, location);
  
  if (scenario.id === 'disaster-flood-risk') {
    const maxPrecip = getMaxPrecipitation(weather);
    const maxProb = getMaxPrecipProb(weather);
    
    let severity: ScenarioEvidence['severity'] = 'LOW';
    let floodRiskInterpretation = 'low';
    
    if (maxPrecip > 50 && maxProb > 80) {
      severity = 'HIGH';
      floodRiskInterpretation = 'high';
    } else if (maxPrecip > 20 && maxProb > 50) {
      severity = 'ELEVATED';
      floodRiskInterpretation = 'elevated';
    } else if (maxPrecip > 5) {
      severity = 'MODERATE';
      floodRiskInterpretation = 'moderate';
    }
    
    return {
      ...base,
      severity,
      confidence: 'HIGH',
      factors: [
        { name: 'Max Precipitation', value: `${maxPrecip} mm`, interpretation: maxPrecip > 50 ? 'heavy' : (maxPrecip > 10 ? 'moderate' : 'light') },
        { name: 'Precipitation Probability', value: `${maxProb}%`, interpretation: maxProb > 80 ? 'high' : 'moderate' },
        { name: 'Flood Risk Level', value: floodRiskInterpretation, interpretation: severity }
      ],
      metrics: [
        { name: 'precipitation_max', value: maxPrecip, unit: 'mm' },
        { name: 'precipitation_prob', value: maxProb, unit: '%' }
      ],
      recommendations: [
        'Check for local drainage warnings',
        'Avoid low-lying areas if heavy rain persists'
      ],
      limitations: []
    };
  }
  
  if (scenario.id === 'disaster-thunderstorm-safety') {
    const currentCode = weather.current.weather_code;
    const isThunderstorm = [95, 96, 99].includes(currentCode);
    
    const severity: ScenarioEvidence['severity'] = isThunderstorm ? 'HIGH' : 'LOW';
    
    return {
      ...base,
      severity,
      confidence: 'HIGH',
      factors: [
        { name: 'Current Thunderstorm Activity', value: isThunderstorm ? 'Yes' : 'No', interpretation: isThunderstorm ? 'Hazardous' : 'Safe' }
      ],
      metrics: [
        { name: 'weather_code', value: currentCode }
      ],
      recommendations: isThunderstorm ? ['Seek indoor shelter immediately', 'Avoid open fields and tall objects'] : ['Standard outdoor precautions apply'],
      limitations: ['Lightning strikes cannot be predicted exactly']
    };
  }

  throw new Error(`Unknown disaster scenario: ${scenario.id}`);
};
