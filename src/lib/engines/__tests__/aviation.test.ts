import { describe, it, expect } from 'vitest';
import { evaluateAviationDecision } from '../aviation';
import { EngineInput } from '../types';
import { CanonicalWeatherDataset } from '../../weather/schema';

function createMockWeather(overrides = {}): CanonicalWeatherDataset {
  return {
    location: {
      latitude: 19.0896,
      longitude: 72.8656,
      city: 'Mumbai Airport (VABB)',
      display_location: 'Mumbai, India',
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
      temperature_c: 28,
      feels_like_c: 30,
      humidity_pct: 70,
      dew_point_c: 22,
      precipitation_mm: 0,
      rain_mm: 0,
      precipitation_probability: 0,
      rain_probability_pct: 0,
      weather_code: 1,
      condition: 'Mainly Clear',
      wind_speed_kmh: 12,
      wind_direction_deg: 260,
      wind_direction_label: 'W',
      wind_gusts_kmh: 18,
      cloud_cover_pct: 25,
      pressure_hpa: 1011,
      visibility_km: 10,
      uv_index: 7,
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
        high_c: 31,
        low_c: 24,
        daily_precipitation_probability: 10,
        rain_probability_pct: 10,
        precipitation_sum_mm: 0,
        wind_speed_max_kmh: 15,
        wind_gusts_max_kmh: 22,
        uv_index_max: 8,
        sunrise: '06:20',
        sunset: '18:35'
      }
    ],
    hourly: [],
    ...overrides
  } as CanonicalWeatherDataset;
}

describe('Aviation Decision Engine', () => {
  it('approves VFR operations when ceilings, visibility, and surface winds are favorable', () => {
    const input: EngineInput = {
      query: {
        domain: 'aviation',
        intent: 'flight_conditions',
        location: 'Mumbai Airport',
        targetDate: 'today',
        targetDateOffsetDays: 0,
        rawText: 'Can I fly VFR at Mumbai airport today?',
        confidence: 0.95
      },
      weather: createMockWeather()
    };

    const decision = evaluateAviationDecision(input);

    expect(decision.decision).toBe('FAVORABLE');
    expect(decision.risk_level).toBe('LOW');
    expect(decision.reasons.some(r => r.factor.includes('Flight Category') && r.value.toString().includes('VFR'))).toBe(true);
  });

  it('rejects flight operations when severe convective storms / microbursts are active', () => {
    const input: EngineInput = {
      query: {
        domain: 'aviation',
        intent: 'flight_conditions',
        location: 'Mumbai Airport',
        targetDate: 'today',
        targetDateOffsetDays: 0,
        rawText: 'Flight conditions at airport?',
        confidence: 0.95
      },
      weather: createMockWeather({
        current: { weather_code: 95, visibility_km: 4 },
        daily: [{ weather_code: 95, wind_speed_max_kmh: 45, wind_gusts_max_kmh: 65 }]
      })
    };

    const decision = evaluateAviationDecision(input);

    expect(decision.decision).toBe('NOT_RECOMMENDED');
    expect(decision.risk_level).toBe('EXTREME');
    expect(decision.summary).toContain('CRITICAL AVIATION HAZARD');
  });

  it('flags crosswind and gust factor caution when surface winds exceed 20 knots', () => {
    const input: EngineInput = {
      query: {
        domain: 'aviation',
        intent: 'flight_conditions',
        location: 'Delhi Airport',
        targetDate: 'tomorrow',
        targetDateOffsetDays: 1,
        rawText: 'Delhi airport crosswind status',
        confidence: 0.95
      },
      weather: createMockWeather({
        daily: [{ weather_code: 2, wind_speed_max_kmh: 42, wind_gusts_max_kmh: 58 }]
      })
    };

    const decision = evaluateAviationDecision(input);

    expect(decision.decision).toBe('CAUTION');
    expect(decision.reasons.some(r => r.factor.includes('Surface Wind & Gusts'))).toBe(true);
  });
});
