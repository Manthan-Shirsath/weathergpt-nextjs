import { describe, it, expect } from 'vitest';
import { evaluateMarineDecision } from '../marine';
import { EngineInput } from '../types';
import { CanonicalWeatherDataset } from '../../weather/schema';

function createMockWeather(overrides = {}): CanonicalWeatherDataset {
  return {
    location: {
      latitude: 18.9220,
      longitude: 72.8347,
      city: 'Mumbai Harbour',
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
      temperature_c: 29,
      feels_like_c: 32,
      humidity_pct: 75,
      dew_point_c: 24,
      precipitation_mm: 0,
      rain_mm: 0,
      precipitation_probability: 0,
      rain_probability_pct: 0,
      weather_code: 1,
      condition: 'Mainly Clear',
      wind_speed_kmh: 15,
      wind_direction_deg: 270,
      wind_direction_label: 'W',
      wind_gusts_kmh: 22,
      cloud_cover_pct: 30,
      pressure_hpa: 1012,
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
        high_c: 30,
        low_c: 25,
        daily_precipitation_probability: 10,
        rain_probability_pct: 10,
        precipitation_sum_mm: 0,
        wind_speed_max_kmh: 18,
        wind_gusts_max_kmh: 26,
        uv_index_max: 7,
        sunrise: '06:20',
        sunset: '18:35'
      }
    ],
    hourly: [],
    ...overrides
  } as CanonicalWeatherDataset;
}

describe('Marine Decision Engine', () => {
  it('triggers Small Craft Advisory (SCA) when waves reach 2.0m', () => {
    const input: EngineInput = {
      query: {
        domain: 'marine',
        intent: 'marine_safety',
        location: 'Mumbai Harbour',
        targetDate: 'tomorrow',
        targetDateOffsetDays: 1,
        rawText: 'Is it safe for small fishing boats offshore in Mumbai tomorrow?',
        confidence: 0.95
      },
      weather: createMockWeather(),
      marineData: {
        targetDateStr: '2026-09-24',
        waveHeightMax: 2.3,
        waveHeightAvg: 1.8,
        wavePeriodAvg: 8.5,
        swellWaveHeightMax: 1.6,
        swellWavePeriodAvg: 9.0,
        seaState: 'MODERATE',
        isAvailable: true
      }
    };

    const decision = evaluateMarineDecision(input);

    expect(decision.decision).toBe('NOT_RECOMMENDED');
    expect(decision.risk_level).toBe('HIGH');
    expect(decision.summary).toContain('SMALL CRAFT ADVISORY');
    expect(decision.reasons.some(r => r.factor.includes('Small Craft Advisory'))).toBe(true);
  });

  it('triggers Gale Warning when winds exceed 34 knots or waves exceed 3.5m', () => {
    const input: EngineInput = {
      query: {
        domain: 'marine',
        intent: 'marine_safety',
        location: 'Goa Coast',
        targetDate: 'today',
        targetDateOffsetDays: 0,
        rawText: 'Offshore sailing conditions in Goa',
        confidence: 0.95
      },
      weather: createMockWeather({
        daily: [{ wind_speed_max_kmh: 68 }] // ~36 knots
      }),
      marineData: {
        targetDateStr: '2026-09-23',
        waveHeightMax: 3.8,
        waveHeightAvg: 3.1,
        wavePeriodAvg: 10.0,
        swellWaveHeightMax: 2.8,
        swellWavePeriodAvg: 11.5,
        seaState: 'ROUGH',
        isAvailable: true
      }
    };

    const decision = evaluateMarineDecision(input);

    expect(decision.decision).toBe('NOT_RECOMMENDED');
    expect(decision.risk_level).toBe('EXTREME');
    expect(decision.summary).toContain('GALE WARNING');
  });

  it('approves boating when sea state is calm/slight and winds are light', () => {
    const input: EngineInput = {
      query: {
        domain: 'marine',
        intent: 'marine_safety',
        location: 'Mumbai Harbour',
        targetDate: 'today',
        targetDateOffsetDays: 0,
        rawText: 'Can I go sailing today in Mumbai?',
        confidence: 0.95
      },
      weather: createMockWeather({
        daily: [{ wind_speed_max_kmh: 12 }] // ~6 knots
      }),
      marineData: {
        targetDateStr: '2026-09-23',
        waveHeightMax: 0.6,
        waveHeightAvg: 0.4,
        wavePeriodAvg: 5.5,
        swellWaveHeightMax: 0.3,
        swellWavePeriodAvg: 6.0,
        seaState: 'SLIGHT',
        isAvailable: true
      }
    };

    const decision = evaluateMarineDecision(input);

    expect(decision.decision).toBe('FAVORABLE');
    expect(decision.risk_level).toBe('LOW');
    expect(decision.summary).toContain('FAVORABLE MARINE CONDITIONS');
  });
});
