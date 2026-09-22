import { describe, it, expect } from 'vitest';
import { evaluateUrbanDecision } from '../urban';
import { EngineInput } from '../types';
import { CanonicalWeatherDataset } from '../../weather/schema';

function createMockWeather(overrides = {}): CanonicalWeatherDataset {
  return {
    location: {
      latitude: 18.5204,
      longitude: 73.8567,
      city: 'Pune',
      display_location: 'Pune, Maharashtra, India',
      region: 'Maharashtra',
      country: 'India'
    },
    freshness: {
      provider: 'open_meteo',
      nwp_source: 'open_meteo',
      nwp_model: 'gfs_seamless',
      fetched_at: new Date().toISOString(),
      observed_at: new Date().toISOString(),
      ttl_seconds: 900,
      stale: false
    },
    current: {
      temperature_c: 27,
      feels_like_c: 28,
      humidity_pct: 65,
      dew_point_c: 20,
      precipitation_mm: 0,
      rain_mm: 0,
      precipitation_probability: 20,
      rain_probability_pct: 20,
      weather_code: 1,
      condition: 'Mainly Clear',
      wind_speed_kmh: 10,
      wind_direction_deg: 250,
      wind_direction_label: 'WSW',
      wind_gusts_kmh: 15,
      cloud_cover_pct: 35,
      pressure_hpa: 1012,
      visibility_km: 10,
      uv_index: 6,
      icon: 'clear-day'
    },
    daily: [
      {
        day: 'Wed',
        date: '2026-09-23',
        date_iso: '2026-09-23T00:00:00Z',
        weather_code: 1,
        condition: 'Clear sky',
        icon: 'clear-day',
        high_c: 30,
        low_c: 21,
        daily_precipitation_probability: 20,
        rain_probability_pct: 20,
        precipitation_sum_mm: 0,
        wind_speed_max_kmh: 12,
        wind_gusts_max_kmh: 18,
        uv_index_max: 7,
        sunrise: '06:18',
        sunset: '18:32'
      }
    ],
    hourly: [],
    ...overrides
  } as CanonicalWeatherDataset;
}

describe('Urban Decision Engine', () => {
  it('identifies severe transit disruption and underpass waterlogging during heavy rain', () => {
    const input: EngineInput = {
      query: {
        domain: 'urban',
        intent: 'summary',
        location: 'Pune',
        targetDate: 'today',
        targetDateOffsetDays: 0,
        timeRange: { startHour: 17, endHour: 20, label: 'evening rush hour (17:30 - 20:30)' },
        rawText: 'How will rain affect evening rush hour commute in Pune?',
        confidence: 0.95
      },
      weather: createMockWeather({
        daily: [{ precipitation_sum_mm: 35, daily_precipitation_probability: 85 }]
      })
    };

    const decision = evaluateUrbanDecision(input);

    expect(decision.decision).toBe('NOT_RECOMMENDED');
    expect(decision.risk_level).toBe('HIGH');
    expect(decision.summary).toContain('SEVERE COMMUTE DISRUPTION');
    expect(decision.reasons.some(r => r.factor.includes('Urban Drainage Surcharge'))).toBe(true);
    expect(decision.reasons.some(r => r.factor.includes('Transit Disruption Index'))).toBe(true);
  });

  it('detects Urban Heat Island (UHI) night heat retention when minimum temperature stays high', () => {
    const input: EngineInput = {
      query: {
        domain: 'urban',
        intent: 'summary',
        location: 'Delhi',
        targetDate: 'today',
        targetDateOffsetDays: 0,
        rawText: 'Urban heat conditions in Delhi today',
        confidence: 0.95
      },
      weather: createMockWeather({
        daily: [{ high_c: 41, low_c: 29 }]
      })
    };

    const decision = evaluateUrbanDecision(input);

    expect(decision.decision).toBe('CAUTION');
    expect(decision.summary).toContain('URBAN HEAT STRESS ADVISORY');
    expect(decision.reasons.some(r => r.factor.includes('Urban Heat Island'))).toBe(true);
  });

  it('reports favorable commute flow when dry weather prevails', () => {
    const input: EngineInput = {
      query: {
        domain: 'urban',
        intent: 'summary',
        location: 'Pune',
        targetDate: 'today',
        targetDateOffsetDays: 0,
        timeRange: { startHour: 8, endHour: 10, label: 'morning rush hour (08:00 - 10:30)' },
        rawText: 'Morning commute conditions in Pune',
        confidence: 0.95
      },
      weather: createMockWeather({
        daily: [{ high_c: 28, low_c: 20, precipitation_sum_mm: 0, daily_precipitation_probability: 5 }]
      })
    };

    const decision = evaluateUrbanDecision(input);

    expect(decision.decision).toBe('FAVORABLE');
    expect(decision.risk_level).toBe('LOW');
    expect(decision.summary).toContain('FAVORABLE COMMUTE');
  });
});
