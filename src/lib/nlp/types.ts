export type DomainType = 
  | 'agriculture' 
  | 'general' 
  | 'disaster' 
  | 'aviation' 
  | 'marine' 
  | 'urban' 
  | 'research';

export type IntentType =
  | 'spraying'
  | 'irrigation'
  | 'harvesting'
  | 'sowing'
  | 'heat_stress'
  | 'frost_risk'
  | 'precipitation'
  | 'temperature'
  | 'wind'
  | 'summary'
  | 'flight_conditions'
  | 'marine_safety'
  | 'flood_risk';

export interface TimeRange {
  startHour: number; // 0-23
  endHour: number;   // 0-23
  label: string;
}

export interface ParsedQuery {
  domain: DomainType;
  intent: IntentType;
  location?: string;
  targetDate: 'today' | 'tomorrow' | 'day_after' | 'specific_date';
  targetDateOffsetDays: number; // 0 for today, 1 for tomorrow, etc.
  timeRange?: TimeRange;
  crop?: string;
  rawText: string;
  confidence: number;
}
