import { describe, it, expect } from 'vitest';
import { analyzeGeneral } from '../analyzers/general';
import { ExpertScenario } from '../types';
import { CanonicalWeatherDataset } from '../../weather/schema';

describe('General Analyzer', () => {
  it('should assess elevated severity for high precipitation', () => {
    const mockScenario: ExpertScenario = {
      id: 'general-personal-briefing',
      domain: 'general',
      title: 'Personal Briefing',
      question: 'Should I take an umbrella today?',
      description: 'Test description',
      icon: '☔'
    };

    const mockWeather: CanonicalWeatherDataset = {
      location: { city: 'Test', display_location: 'Test, Test', region: 'Test', country: 'Test', latitude: 0, longitude: 0 },
      current: {
        temperature_c: 20,
        feels_like_c: 20,
        humidity_pct: 50,
        precipitation_mm: 5,
        rain_mm: 5,
        wind_speed_kmh: 10,
        wind_direction_deg: 0,
        wind_direction_label: 'N',
        cloud_cover_pct: 100,
        uv_index: 1,
        precipitation_probability: 100,
        rain_probability_pct: 100,
        pressure_hpa: 1013,
        weather_code: 0,
        condition: 'Rain',
        icon: 'rain',
        wind_gusts_kmh: 15,
        visibility_km: 10,
      },
      hourly: [],
      daily: [
        {
          day: 'Sunday',
          date: '2023-01-01',
          date_iso: '2023-01-01',
          high_c: 20,
          low_c: 15,
          condition: 'Rain',
          icon: 'rain',
          weather_code: 0,
          daily_precipitation_probability: 100,
          rain_probability_pct: 100,
          precipitation_sum_mm: 25,
          wind_speed_max_kmh: 10,
          wind_gusts_max_kmh: 15,
          uv_index_max: 1,
          sunrise: '',
          sunset: ''
        }
      ],
      freshness: { provider: 'test', nwp_source: 'test', nwp_model: 'test', fetched_at: '', observed_at: '', stale: false, ttl_seconds: 0 }
    };

    const evidence = analyzeGeneral(mockScenario, mockWeather, { name: 'Test', latitude: 0, longitude: 0 });
    
    expect(evidence.severity).toBe('ELEVATED');
    expect(evidence.recommendations).toContain('Carry an umbrella');
  });
});
