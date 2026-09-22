import { ExpertScenario } from './types';

export const SCENARIOS: ExpertScenario[] = [
  // 🌪️ DISASTER EXPERT
  {
    id: 'disaster-flood-risk',
    domain: 'disaster',
    title: 'Flood Risk Assessment',
    question: 'Could today\'s rainfall create localized flooding?',
    description: 'Analyzes precipitation probability, amount, and duration to assess flood risk.',
    icon: '🌪️',
  },
  {
    id: 'disaster-thunderstorm-safety',
    domain: 'disaster',
    title: 'Lightning & Thunderstorm Safety',
    question: 'Are thunderstorms creating a meaningful outdoor safety concern?',
    description: 'Evaluates current thunderstorm activity and severe weather indicators.',
    icon: '⚡',
  },

  // 🌾 AGRICULTURE EXPERT
  {
    id: 'agriculture-rain-advisory',
    domain: 'agriculture',
    title: 'Heavy Rain Farm Advisory',
    question: 'How should a farmer prepare for the expected rainfall?',
    description: 'Analyzes precipitation and temperature to provide drainage and operational advice.',
    icon: '🌾',
  },
  {
    id: 'agriculture-stress-assessment',
    domain: 'agriculture',
    title: 'Weather Stress Assessment',
    question: 'Could the upcoming weather create crop stress?',
    description: 'Evaluates temperature extremes and lack of rainfall.',
    icon: '🌡️',
  },

  // ✈️ AVIATION EXPERT
  {
    id: 'aviation-flight-impact',
    domain: 'aviation',
    title: 'Flight Weather Impact',
    question: 'How could today\'s weather affect flight operations?',
    description: 'Assesses wind, visibility, and precipitation for general aviation risk.',
    icon: '✈️',
  },
  {
    id: 'aviation-convective-assessment',
    domain: 'aviation',
    title: 'Convective Weather Assessment',
    question: 'Are thunderstorms creating a significant aviation concern?',
    description: 'Focuses on thunderstorm and convective weather hazards along flight paths.',
    icon: '⛈️',
  },

  // 🌊 MARINE EXPERT
  {
    id: 'marine-conditions',
    domain: 'marine',
    title: 'Marine Conditions',
    question: 'Are current conditions suitable for a small vessel?',
    description: 'Analyzes wind speeds and weather for small craft advisories.',
    icon: '🌊',
  },
  {
    id: 'marine-change-risk',
    domain: 'marine',
    title: 'Weather Change Risk',
    question: 'Could conditions deteriorate during the next several hours?',
    description: 'Compares short-term forecast periods to identify rapid deterioration.',
    icon: '⛵',
  },

  // 🏙️ URBAN EXPERT
  {
    id: 'urban-rain-impact',
    domain: 'urban',
    title: 'Urban Rain Impact',
    question: 'How could today\'s weather affect city infrastructure?',
    description: 'Translates heavy rain into urban flooding and drainage concerns.',
    icon: '🏙️',
  },
  {
    id: 'urban-mobility-risk',
    domain: 'urban',
    title: 'Mobility Risk Assessment',
    question: 'When could weather have the greatest impact on travel today?',
    description: 'Identifies the peak weather impact window for commuters.',
    icon: '🚗',
  },

  // 🔬 RESEARCH EXPERT
  {
    id: 'research-forecast-uncertainty',
    domain: 'research',
    title: 'Forecast Uncertainty Assessment',
    question: 'What are the main sources of uncertainty in today\'s forecast?',
    description: 'Examines typical sources of weather divergence based on standard model behaviors.',
    icon: '🔬',
  },
  {
    id: 'research-model-limitations',
    domain: 'research',
    title: 'Model Limitations',
    question: 'What weather features might this forecast struggle to predict?',
    description: 'Analyzes standard model limitations for the current weather conditions.',
    icon: '📊',
  },

  // ☀️ GENERAL WEATHER EXPERT
  {
    id: 'general-personal-briefing',
    domain: 'general',
    title: 'Personal Weather Briefing',
    question: 'What should I know about today\'s weather before I leave?',
    description: 'A concise, decision-oriented summary of the day\'s key weather.',
    icon: '☀️',
  }
];

export function getScenarioById(id: string): ExpertScenario | undefined {
  return SCENARIOS.find(s => s.id === id);
}

export function getScenariosByDomain(domain: string): ExpertScenario[] {
  return SCENARIOS.filter(s => s.domain === domain);
}
