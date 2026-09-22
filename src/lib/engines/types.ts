import { ParsedQuery, DomainType, IntentType } from '../nlp/types';
import { CanonicalWeatherDataset } from '../weather/schema';
import { DetailedMultiModelComparison } from '../weather/multi-model';
import { MarineForecastData } from '../weather/marine';

export interface DecisionFactor {
  factor: string;
  value: string | number;
  threshold: string;
  impact: 'positive' | 'warning' | 'critical';
}

export interface DecisionResult {
  domain: DomainType;
  intent: IntentType;
  targetDate: string;
  timeWindowLabel: string;
  location: string;
  targetCrop?: string;
  decision: 'RECOMMENDED' | 'CAUTION' | 'NOT_RECOMMENDED' | 'FAVORABLE' | 'UNFAVORABLE';
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  reasons: DecisionFactor[];
  actionable_advice: string[];
  optimal_window?: string;
  model_intelligence: {
    consensus_score: number;
    spread_level: 'LOW' | 'MODERATE' | 'HIGH';
    rain_probability_consensus: number;
    wind_speed_consensus: number;
    temperature_consensus: number;
    model_values: Record<string, number | null | undefined>;
    divergent_models: string[];
  };
}

export interface EngineInput {
  query: ParsedQuery;
  weather: CanonicalWeatherDataset;
  multiModel?: DetailedMultiModelComparison | null;
  marineData?: MarineForecastData | null;
}
