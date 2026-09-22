import { describe, it, expect } from 'vitest';
import { parseNaturalQuery, extractLocation, extractTemporal, extractCrop, extractIntentAndDomain } from '../intent-extractor';

describe('NLP Intent & Entity Extractor', () => {
  it('extracts spraying intent, Nashik location, and tomorrow morning temporal slot', () => {
    const query = 'Should I spray pesticides tomorrow morning in Nashik?';
    const parsed = parseNaturalQuery(query);

    expect(parsed.domain).toBe('agriculture');
    expect(parsed.intent).toBe('spraying');
    expect(parsed.location).toBe('Nashik');
    expect(parsed.targetDate).toBe('tomorrow');
    expect(parsed.targetDateOffsetDays).toBe(1);
    expect(parsed.timeRange?.label).toBe('morning (06:00 - 12:00)');
  });

  it('extracts precipitation intent, Pune location, and explicit time window', () => {
    const query = 'Will it rain in Pune between 9 AM and 4 PM?';
    const parsed = parseNaturalQuery(query);

    expect(parsed.domain).toBe('general');
    expect(parsed.intent).toBe('precipitation');
    expect(parsed.location).toBe('Pune');
    expect(parsed.timeRange?.startHour).toBe(9);
    expect(parsed.timeRange?.endHour).toBe(16);
  });

  it('extracts irrigation intent and crop entity', () => {
    const query = 'Do I need to irrigate my cotton crop today in Nagpur?';
    const parsed = parseNaturalQuery(query);

    expect(parsed.domain).toBe('agriculture');
    expect(parsed.intent).toBe('irrigation');
    expect(parsed.location).toBe('Nagpur');
    expect(parsed.crop).toBe('Cotton');
    expect(parsed.targetDate).toBe('today');
  });

  it('extracts disaster intent for severe weather', () => {
    const query = 'Is there any flood risk in Mumbai?';
    const parsed = parseNaturalQuery(query);

    expect(parsed.domain).toBe('disaster');
    expect(parsed.intent).toBe('flood_risk');
    expect(parsed.location).toBe('Mumbai');
  });

  it('extracts aviation intent for flight conditions', () => {
    const query = 'What are the crosswind and flight conditions at Delhi airport?';
    const parsed = parseNaturalQuery(query);

    expect(parsed.domain).toBe('aviation');
    expect(parsed.intent).toBe('flight_conditions');
    expect(parsed.location).toBe('Delhi');
  });

  it('falls back to defaultLocation if query has no explicit location', () => {
    const query = 'Should I harvest wheat tomorrow afternoon?';
    const parsed = parseNaturalQuery(query, 'Pune');

    expect(parsed.domain).toBe('agriculture');
    expect(parsed.intent).toBe('harvesting');
    expect(parsed.location).toBe('Pune');
    expect(parsed.crop).toBe('Wheat');
    expect(parsed.timeRange?.label).toBe('afternoon (12:00 - 17:00)');
  });
});
