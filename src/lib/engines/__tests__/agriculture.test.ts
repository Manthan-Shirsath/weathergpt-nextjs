import { describe, it, expect } from 'vitest';
import { evaluateAgricultureDecision } from '../agriculture';
import { EngineInput } from '../types';
import { CanonicalWeatherDataset } from '../../weather/schema';

function createMockWeather(overrides = {}): CanonicalWeatherDataset {
  return {
    location: {
      latitude: 19.9975,
      longitude: 73.7898,
      city: 'Nashik',
      display_location: 'Nashik, Maharashtra, India',
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
      temperature_c: 26,
      feels_like_c: 26,
      humidity_pct: 65,
      dew_point_c: 18,
      precipitation_mm: 0,
      rain_mm: 0,
      precipitation_probability: 0,
      rain_probability_pct: 0,
      weather_code: 1,
      condition: 'Mainly Clear',
      wind_speed_kmh: 10,
      wind_direction_deg: 240,
      wind_direction_label: 'WSW',
      wind_gusts_kmh: 14,
      cloud_cover_pct: 20,
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
        low_c: 20,
        daily_precipitation_probability: 10,
        rain_probability_pct: 10,
        precipitation_sum_mm: 0,
        wind_speed_max_kmh: 12,
        wind_gusts_max_kmh: 16,
        uv_index_max: 7,
        sunrise: '06:15',
        sunset: '18:30'
      }
    ],
    hourly: [],
    ...overrides
  } as CanonicalWeatherDataset;
}

describe('Agriculture Decision Engine', () => {
  it('rejects pesticide spraying if multi-model rain probability exceeds wash-off threshold', () => {
    const input: EngineInput = {
      query: {
        domain: 'agriculture',
        intent: 'spraying',
        location: 'Nashik',
        targetDate: 'tomorrow',
        targetDateOffsetDays: 1,
        timeRange: { startHour: 6, endHour: 12, label: 'morning' },
        rawText: 'Should I spray pesticides tomorrow morning in Nashik?',
        confidence: 0.95
      },
      weather: createMockWeather(),
      multiModel: {
        targetDateStr: '2026-09-24',
        timeWindowLabel: 'morning',
        rainProbability: {
          variable: 'precipitation_probability',
          unit: '%',
          models: { ecmwf: 75, gfs: 68, icon: 72 },
          consensus: 71.7,
          min: 68,
          max: 75,
          spread: 7,
          spreadLevel: 'LOW',
          agreementPercentage: 92
        },
        precipitationAmount: {
          variable: 'precipitation',
          unit: 'mm',
          models: { ecmwf: 4.2, gfs: 3.8, icon: 4.0 },
          consensus: 4.0,
          min: 3.8,
          max: 4.2,
          spread: 0.4,
          spreadLevel: 'LOW',
          agreementPercentage: 95
        },
        windSpeed: {
          variable: 'wind_speed',
          unit: 'km/h',
          models: { ecmwf: 11, gfs: 10, icon: 11 },
          consensus: 10.7,
          min: 10,
          max: 11,
          spread: 1,
          spreadLevel: 'LOW',
          agreementPercentage: 98
        },
        temperature: {
          variable: 'temperature',
          unit: '°C',
          models: { ecmwf: 27, gfs: 28, icon: 27 },
          consensus: 27.3,
          min: 27,
          max: 28,
          spread: 1,
          spreadLevel: 'LOW',
          agreementPercentage: 95
        },
        overallConsensusScore: 94,
        overallUncertainty: 'LOW',
        divergentModels: []
      }
    };

    const decision = evaluateAgricultureDecision(input);

    expect(decision.decision).toBe('NOT_RECOMMENDED');
    expect(decision.risk_level).toBe('HIGH');
    expect(decision.reasons.some(r => r.factor === 'Precipitation Probability')).toBe(true);
    expect(decision.actionable_advice.length).toBeGreaterThan(0);
  });

  it('approves pesticide spraying when rain and wind conditions are optimal', () => {
    const input: EngineInput = {
      query: {
        domain: 'agriculture',
        intent: 'spraying',
        location: 'Nashik',
        targetDate: 'tomorrow',
        targetDateOffsetDays: 1,
        crop: 'Grapes',
        rawText: 'Can I spray my grapes tomorrow?',
        confidence: 0.95
      },
      weather: createMockWeather(),
      multiModel: {
        targetDateStr: '2026-09-24',
        timeWindowLabel: 'full day',
        rainProbability: {
          variable: 'precipitation_probability',
          unit: '%',
          models: { ecmwf: 10, gfs: 5, icon: 10 },
          consensus: 8.3,
          min: 5,
          max: 10,
          spread: 5,
          spreadLevel: 'LOW',
          agreementPercentage: 95
        },
        precipitationAmount: {
          variable: 'precipitation',
          unit: 'mm',
          models: { ecmwf: 0, gfs: 0, icon: 0 },
          consensus: 0,
          min: 0,
          max: 0,
          spread: 0,
          spreadLevel: 'LOW',
          agreementPercentage: 100
        },
        windSpeed: {
          variable: 'wind_speed',
          unit: 'km/h',
          models: { ecmwf: 8, gfs: 9, icon: 8 },
          consensus: 8.3,
          min: 8,
          max: 9,
          spread: 1,
          spreadLevel: 'LOW',
          agreementPercentage: 98
        },
        temperature: {
          variable: 'temperature',
          unit: '°C',
          models: { ecmwf: 26, gfs: 27, icon: 26 },
          consensus: 26.3,
          min: 26,
          max: 27,
          spread: 1,
          spreadLevel: 'LOW',
          agreementPercentage: 98
        },
        overallConsensusScore: 97,
        overallUncertainty: 'LOW',
        divergentModels: []
      }
    };

    const decision = evaluateAgricultureDecision(input);

    expect(decision.decision).toBe('RECOMMENDED');
    expect(decision.risk_level).toBe('LOW');
    expect(decision.targetCrop).toBe('Grapes');
  });

  it('recommends postponing irrigation when incoming rainfall is significant', () => {
    const input: EngineInput = {
      query: {
        domain: 'agriculture',
        intent: 'irrigation',
        location: 'Nagpur',
        targetDate: 'today',
        targetDateOffsetDays: 0,
        crop: 'Cotton',
        rawText: 'Should I irrigate cotton today in Nagpur?',
        confidence: 0.95
      },
      weather: createMockWeather(),
      multiModel: {
        targetDateStr: '2026-09-23',
        timeWindowLabel: 'full day',
        rainProbability: {
          variable: 'precipitation_probability',
          unit: '%',
          models: { ecmwf: 80, gfs: 75, icon: 85 },
          consensus: 80,
          min: 75,
          max: 85,
          spread: 10,
          spreadLevel: 'LOW',
          agreementPercentage: 90
        },
        precipitationAmount: {
          variable: 'precipitation',
          unit: 'mm',
          models: { ecmwf: 12, gfs: 9, icon: 11 },
          consensus: 10.7,
          min: 9,
          max: 12,
          spread: 3,
          spreadLevel: 'LOW',
          agreementPercentage: 90
        },
        windSpeed: {
          variable: 'wind_speed',
          unit: 'km/h',
          models: { ecmwf: 12, gfs: 10, icon: 11 },
          consensus: 11,
          min: 10,
          max: 12,
          spread: 2,
          spreadLevel: 'LOW',
          agreementPercentage: 95
        },
        temperature: {
          variable: 'temperature',
          unit: '°C',
          models: { ecmwf: 29, gfs: 30, icon: 29 },
          consensus: 29.3,
          min: 29,
          max: 30,
          spread: 1,
          spreadLevel: 'LOW',
          agreementPercentage: 98
        },
        overallConsensusScore: 92,
        overallUncertainty: 'LOW',
        divergentModels: []
      }
    };

    const decision = evaluateAgricultureDecision(input);

    expect(decision.decision).toBe('NOT_RECOMMENDED');
    expect(decision.reasons.some(r => r.factor.includes('Incoming Rain'))).toBe(true);
  });
});
