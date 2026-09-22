import React from 'react';
import { cookies } from 'next/headers';
import { parseLocationCookie } from '@/lib/location/store';
import { weatherService } from '@/lib/weather/service';
import { fetchComprehensiveForecastIntelligence } from '@/lib/weather/multi-model';
import { ForecastIntelligenceClient } from './ForecastIntelligenceClient';

// Default fallback location
const DEFAULT_LAT = 18.5204;
const DEFAULT_LON = 73.8567; // Pune

export default async function ForecastIntelligencePage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = searchParams ? await searchParams : {};
  const cookieStore = await cookies();
  const savedLocation = parseLocationCookie(cookieStore.get('skycast_location')?.value);
  
  let lat = DEFAULT_LAT;
  let lon = DEFAULT_LON;
  let locName = 'Pune';

  if (typeof params.city === 'string' && params.city.trim() !== '') {
    try {
      const weather = await weatherService.getWeatherForCity(params.city);
      lat = weather.location.latitude;
      lon = weather.location.longitude;
      locName = weather.location.city || params.city;
    } catch {
      locName = params.city;
    }
  } else if (savedLocation) {
    locName = savedLocation.name || 'Selected Location';
    if (savedLocation.lat && savedLocation.lon) {
      lat = savedLocation.lat;
      lon = savedLocation.lon;
    } else {
      try {
        const weather = await weatherService.getWeatherForCity(locName);
        lat = weather.location.latitude;
        lon = weather.location.longitude;
      } catch {
        // fallback
      }
    }
  }

  const data = await fetchComprehensiveForecastIntelligence(lat, lon, locName);

  if (!data) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-100">Multi-Model Forecast Temporarily Unavailable</h2>
          <p className="text-sm text-slate-400 max-w-md">
            The Open-Meteo multi-model ensemble service is experiencing latency. Please try refreshing or selecting a different location.
          </p>
        </div>
      </div>
    );
  }

  return <ForecastIntelligenceClient initialData={data} />;
}
