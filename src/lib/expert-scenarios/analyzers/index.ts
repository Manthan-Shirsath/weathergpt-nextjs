import { ExpertScenario, ScenarioEvidence, ScenarioAnalyzer } from '../types';
import { CanonicalWeatherDataset } from '../../weather/schema';
import { analyzeDisaster } from './disaster';
import { analyzeAgriculture } from './agriculture';
import { analyzeAviation } from './aviation';
import { analyzeMarine } from './marine';
import { analyzeUrban } from './urban';
import { analyzeResearch } from './research';
import { analyzeGeneral } from './general';

export const analyzeScenario: ScenarioAnalyzer = (scenario, weather, location) => {
  switch (scenario.domain) {
    case 'disaster':
      return analyzeDisaster(scenario, weather, location);
    case 'agriculture':
      return analyzeAgriculture(scenario, weather, location);
    case 'aviation':
      return analyzeAviation(scenario, weather, location);
    case 'marine':
      return analyzeMarine(scenario, weather, location);
    case 'urban':
      return analyzeUrban(scenario, weather, location);
    case 'research':
      return analyzeResearch(scenario, weather, location);
    case 'general':
      return analyzeGeneral(scenario, weather, location);
    default:
      throw new Error(`Analyzer not implemented for domain: ${scenario.domain}`);
  }
};
