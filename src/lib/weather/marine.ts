export interface MarineForecastData {
  targetDateStr: string;
  waveHeightMax: number;
  waveHeightAvg: number;
  wavePeriodAvg: number;
  swellWaveHeightMax: number;
  swellWavePeriodAvg: number;
  seaState: 'CALM' | 'SMOOTH' | 'SLIGHT' | 'MODERATE' | 'ROUGH' | 'VERY_ROUGH' | 'HIGH';
  isAvailable: boolean;
}

const MARINE_API_URL = "https://marine-api.open-meteo.com/v1/marine";

export function determineSeaState(waveHeightMeters: number): MarineForecastData['seaState'] {
  if (waveHeightMeters < 0.1) return 'CALM';
  if (waveHeightMeters <= 0.5) return 'SMOOTH';
  if (waveHeightMeters <= 1.25) return 'SLIGHT';
  if (waveHeightMeters <= 2.5) return 'MODERATE';
  if (waveHeightMeters <= 4.0) return 'ROUGH';
  if (waveHeightMeters <= 6.0) return 'VERY_ROUGH';
  return 'HIGH';
}

export async function fetchMarineForecast(
  lat: number,
  lon: number,
  targetDayOffset = 0
): Promise<MarineForecastData | null> {
  try {
    const url = new URL(MARINE_API_URL);
    url.searchParams.set("latitude", lat.toString());
    url.searchParams.set("longitude", lon.toString());
    url.searchParams.set("hourly", "wave_height,wave_period,swell_wave_height,swell_wave_period");
    url.searchParams.set("timezone", "auto");

    const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
    if (!res.ok) {
      // Inland coordinates will return 400 because there is no sea surface point nearby
      return {
        targetDateStr: new Date().toISOString().split('T')[0],
        waveHeightMax: 0,
        waveHeightAvg: 0,
        wavePeriodAvg: 0,
        swellWaveHeightMax: 0,
        swellWavePeriodAvg: 0,
        seaState: 'CALM',
        isAvailable: false
      };
    }

    const data = await res.json();
    const hourly = data.hourly;
    if (!hourly || !hourly.time || !hourly.wave_height) {
      return null;
    }

    const times: string[] = hourly.time;
    const waveHeights: (number | null)[] = hourly.wave_height;
    const wavePeriods: (number | null)[] = hourly.wave_period || [];
    const swellHeights: (number | null)[] = hourly.swell_wave_height || [];
    const swellPeriods: (number | null)[] = hourly.swell_wave_period || [];

    // Group 24-hour slices
    const startIndex = Math.min(Math.max(targetDayOffset * 24, 0), times.length - 24);
    const sliceIndices = Array.from({ length: 24 }, (_, i) => startIndex + i);

    const validWaves = sliceIndices.map(i => waveHeights[i]).filter((v): v is number => typeof v === 'number');
    const validPeriods = sliceIndices.map(i => wavePeriods[i]).filter((v): v is number => typeof v === 'number');
    const validSwells = sliceIndices.map(i => swellHeights[i]).filter((v): v is number => typeof v === 'number');
    const validSwellPeriods = sliceIndices.map(i => swellPeriods[i]).filter((v): v is number => typeof v === 'number');

    if (validWaves.length === 0) {
      return {
        targetDateStr: times[startIndex]?.split('T')[0] || new Date().toISOString().split('T')[0],
        waveHeightMax: 0,
        waveHeightAvg: 0,
        wavePeriodAvg: 0,
        swellWaveHeightMax: 0,
        swellWavePeriodAvg: 0,
        seaState: 'CALM',
        isAvailable: false
      };
    }

    const waveHeightMax = Math.round(Math.max(...validWaves) * 10) / 10;
    const waveHeightAvg = Math.round((validWaves.reduce((a, b) => a + b, 0) / validWaves.length) * 10) / 10;
    const wavePeriodAvg = validPeriods.length > 0 
      ? Math.round((validPeriods.reduce((a, b) => a + b, 0) / validPeriods.length) * 10) / 10 
      : 6.0;
    const swellWaveHeightMax = validSwells.length > 0 
      ? Math.round(Math.max(...validSwells) * 10) / 10 
      : 0;
    const swellWavePeriodAvg = validSwellPeriods.length > 0
      ? Math.round((validSwellPeriods.reduce((a, b) => a + b, 0) / validSwellPeriods.length) * 10) / 10
      : 6.0;

    return {
      targetDateStr: times[startIndex]?.split('T')[0] || new Date().toISOString().split('T')[0],
      waveHeightMax,
      waveHeightAvg,
      wavePeriodAvg,
      swellWaveHeightMax,
      swellWavePeriodAvg,
      seaState: determineSeaState(waveHeightMax),
      isAvailable: true
    };
  } catch (err) {
    console.warn("Marine API fetch error or inland location:", err);
    return null;
  }
}
