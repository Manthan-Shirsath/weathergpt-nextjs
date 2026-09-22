import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchComprehensiveForecastIntelligence } from '../multi-model';

describe('Comprehensive Forecast Intelligence', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and synthesizes multi-model forecast with physics and AI models', async () => {
    // Mock fetch for Open-Meteo
    const mockTimes = Array.from({ length: 168 }, (_, i) => {
      const d = new Date('2026-09-22T00:00:00Z');
      d.setHours(d.getHours() + i);
      return d.toISOString().replace('.000Z', '');
    });

    const mockHourlyData = {
      time: mockTimes,
      temperature_2m_ecmwf_ifs025: Array(168).fill(25.0),
      temperature_2m_gfs_seamless: Array(168).fill(26.0),
      temperature_2m_icon_seamless: Array(168).fill(24.5),
      temperature_2m_ecmwf_aifs025: Array(168).fill(25.5),

      precipitation_ecmwf_ifs025: Array(168).fill(0.2),
      precipitation_gfs_seamless: Array(168).fill(0.4),
      precipitation_icon_seamless: Array(168).fill(0.1),
      precipitation_ecmwf_aifs025: Array(168).fill(0.3),

      wind_speed_10m_ecmwf_ifs025: Array(168).fill(12.0),
      wind_speed_10m_gfs_seamless: Array(168).fill(14.0),
      wind_speed_10m_icon_seamless: Array(168).fill(11.5),
      wind_speed_10m_ecmwf_aifs025: Array(168).fill(13.0),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hourly: mockHourlyData })
    } as unknown as Response);

    const result = await fetchComprehensiveForecastIntelligence(18.52, 73.85, 'Pune Test');

    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.locationName).toBe('Pune Test');
    expect(result.hourly.length).toBe(168);
    expect(result.dailyAgreements.length).toBe(7);

    // Check first hour values
    const first = result.hourly[0];
    expect(first.temperature.ecmwf).toBe(25.0);
    expect(first.temperature.gfs).toBe(26.0);
    expect(first.temperature.icon).toBe(24.5);
    expect(first.temperature.aifs).toBe(25.5);
    // WeatherNext 2 is computed
    expect(typeof first.temperature.weathernext).toBe('number');
    expect(first.temperature.consensus).toBeGreaterThan(24);
    expect(first.temperature.spread).toBeGreaterThanOrEqual(0);

    // Check precipitation
    expect(first.precipitation.ecmwf).toBe(0.2);
    expect(first.precipitation.gfs).toBe(0.4);

    // Check wind speed
    expect(first.windSpeed.ecmwf).toBe(12.0);

    // Check synthesis texts
    expect(result.aiAnalysisText.temperature).toContain('Pune Test');
    expect(result.aiAnalysisText.precipitation).toBeDefined();
    expect(result.aiAnalysisText.windSpeed).toBeDefined();
  });
});
