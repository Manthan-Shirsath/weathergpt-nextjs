import { describe, it, expect } from 'vitest';
import { evaluateDisasterDecision } from '../disaster';
import { EngineInput } from '../types';
import { CanonicalWeatherDataset } from '../../weather/schema';

function createMockWeather(overrides = {}): CanonicalWeatherDataset {
  return {
    location: {
      latitude: 19.0760,
      longitude: 72.8777,
      city: 'Mumbai',
      display_location: 'Mumbai, Maharashtra, India',
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
      feels_like_c: 33,
      humidity_pct: 80,
      dew_point_c: 25,
      precipitation_mm: 5,
      rain_mm: 5,
      precipitation_probability: 70,
      rain_probability_pct: 70,
      weather_code: 65,
      condition: 'Heavy Rain',
      wind_speed_kmh: 30,
      wind_direction_deg: 240,
      wind_direction_label: 'WSW',
      wind_gusts_kmh: 45,
      cloud_cover_pct: 95,
      pressure_hpa: 1002,
      visibility_km: 4,
      uv_index: 3,
      icon: 'rain'
    },
    daily: [
      {
        day: 'Wed',
        date: '2026-09-23',
        date_iso: '2026-09-23T00:00:00Z',
        weather_code: 65,
        condition: 'Heavy Rain',
        icon: 'rain',
        high_c: 29,
        low_c: 24,
        daily_precipitation_probability: 85,
        rain_probability_pct: 85,
        precipitation_sum_mm: 85,
        wind_speed_max_kmh: 40,
        wind_gusts_max_kmh: 55,
        uv_index_max: 4,
        sunrise: '06:20',
        sunset: '18:35'
      }
    ],
    hourly: [],
    ...overrides
  } as CanonicalWeatherDataset;
}

describe('Disaster Decision Engine', () => {
  it('triggers RED ALERT extreme risk when rainfall exceeds IMD extreme heavy threshold (>115mm)', () => {
    const input: EngineInput = {
      query: {
        domain: 'disaster',
        intent: 'flood_risk',
        location: 'Mumbai',
        targetDate: 'today',
        targetDateOffsetDays: 0,
        rawText: 'Is there an emergency flood risk in Mumbai today?',
        confidence: 0.95
      },
      weather: createMockWeather({
        daily: [{ precipitation_sum_mm: 140, daily_precipitation_probability: 95, wind_speed_max_kmh: 50 }]
      })
    };

    const decision = evaluateDisasterDecision(input);

    expect(decision.decision).toBe('NOT_RECOMMENDED');
    expect(decision.risk_level).toBe('EXTREME');
    expect(decision.summary).toContain('RED ALERT DISASTER EMERGENCY');
    expect(decision.reasons.some(r => r.factor.includes('IMD Red Alert Rainfall'))).toBe(true);
    expect(decision.actionable_advice.some(a => a.includes('LIFE SAFETY HAZARD'))).toBe(true);
  });

  it('triggers ORANGE ALERT hazard when rainfall meets IMD heavy threshold (64.5 - 115.5mm)', () => {
    const input: EngineInput = {
      query: {
        domain: 'disaster',
        intent: 'flood_risk',
        location: 'Mumbai',
        targetDate: 'today',
        targetDateOffsetDays: 0,
        rawText: 'Any heavy rain hazard in Mumbai?',
        confidence: 0.95
      },
      weather: createMockWeather({
        daily: [{ precipitation_sum_mm: 75, daily_precipitation_probability: 80, wind_speed_max_kmh: 30 }]
      })
    };

    const decision = evaluateDisasterDecision(input);

    expect(decision.decision).toBe('NOT_RECOMMENDED');
    expect(decision.risk_level).toBe('HIGH');
    expect(decision.summary).toContain('ORANGE ALERT HAZARD');
  });

  it('reports benign baseline when no flood or storm triggers are active', () => {
    const input: EngineInput = {
      query: {
        domain: 'disaster',
        intent: 'flood_risk',
        location: 'Pune',
        targetDate: 'today',
        targetDateOffsetDays: 0,
        rawText: 'Is there any flood danger in Pune?',
        confidence: 0.95
      },
      weather: createMockWeather({
        daily: [{ precipitation_sum_mm: 2, daily_precipitation_probability: 15, wind_speed_max_kmh: 12 }]
      })
    };

    const decision = evaluateDisasterDecision(input);

    expect(decision.decision).toBe('FAVORABLE');
    expect(decision.risk_level).toBe('LOW');
    expect(decision.summary).toContain('DISASTER RISK LOW');
  });
});
