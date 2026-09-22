import { AgentMode } from '@/ai/router';
import { CanonicalWeatherDataset } from '../weather/schema';

export interface ExpertScenario {
  id: string;
  domain: AgentMode;
  title: string;
  question: string;
  description: string;
  icon: string; // Lucide icon name or emoji
}

export interface ScenarioEvidence {
  scenarioId: string;
  domain: AgentMode;
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  assessedAt: string;
  severity: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'EXTREME' | 'UNKNOWN' | 'N/A';
  confidence?: 'LOW' | 'MODERATE' | 'HIGH';
  factors: Array<{
    name: string;
    value: string | number;
    interpretation: string;
  }>;
  metrics: Array<{
    name: string;
    value: string | number;
    unit?: string;
  }>;
  recommendations: string[];
  limitations: string[];
}

export type ScenarioAnalyzer = (
  scenario: ExpertScenario,
  weather: CanonicalWeatherDataset,
  location: { name: string; latitude: number; longitude: number }
) => ScenarioEvidence;
