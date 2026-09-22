import { ExpertScenario, ScenarioEvidence, ScenarioAnalyzer } from '../types';
import { createBaseEvidence } from './utils';

export const analyzeResearch: ScenarioAnalyzer = (scenario, weather, location) => {
  const base = createBaseEvidence(scenario, location);
  
  if (scenario.id === 'research-forecast-uncertainty') {
    return {
      ...base,
      severity: 'N/A',
      confidence: 'MODERATE',
      factors: [
        { name: 'Model Spread', value: 'N/A', interpretation: 'Single model output used' }
      ],
      metrics: [],
      recommendations: ['Consider that single-model deterministic outputs can miss convective systems'],
      limitations: ['Multi-model deterministic evaluation is currently limited to the forecast intelligence dashboard']
    };
  }

  if (scenario.id === 'research-model-limitations') {
    return {
      ...base,
      severity: 'N/A',
      confidence: 'MODERATE',
      factors: [
        { name: 'Variables Prone to Disagreement', value: 'Convection, Microclimates', interpretation: 'Typical sources of divergence' }
      ],
      metrics: [],
      recommendations: ['Consider topographic and coastal effects which models resolve differently'],
      limitations: ['Live comparative model data not deterministically analyzed here']
    };
  }
  throw new Error(`Unknown scenario: ${scenario.id}`);
};
