import type { Metadata } from 'next';
import { weatherService } from "@/lib/weather/service";
import { AlertService } from "@/lib/alerts/service";
import { CurrentWeatherCard } from "@/components/weather/CurrentWeatherCard";
import { WeatherMetrics } from "@/components/weather/WeatherMetrics";
import { ForecastChart } from "@/components/weather/ForecastChart";
import { DailyForecast } from "@/components/weather/DailyForecast";
import { DashboardLocationBar } from "@/components/weather/DashboardLocationBar";
import { TemperatureRangeBar } from "@/components/weather/TemperatureRangeBar";
import { AlertTriangle, CloudOff, ShieldAlert } from "lucide-react";
import Link from 'next/link';
import { cookies } from 'next/headers';
import { parseLocationCookie } from '@/lib/location/store';

export const metadata: Metadata = {
  title: "WeatherGPT — Agentic Weather Intelligence",
  description: "AI-powered weather dashboard with real-time forecasts, alerts, and specialized agent intelligence for any location.",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const savedLocation = parseLocationCookie(cookieStore.get('skycast_location')?.value);

  const city = typeof params.city === 'string' && params.city.trim() !== ''
    ? params.city.trim()
    : (savedLocation?.name || 'Pune');
  
  let data;
  let officialAlerts;
  let error;
  
  try {
    const paramCityStr = typeof params.city === 'string' ? params.city : undefined;
    const isSavedCity = savedLocation && (!paramCityStr || paramCityStr.toLowerCase() === savedLocation.name.toLowerCase());
    const weatherPromise = isSavedCity && savedLocation.lat && savedLocation.lon
      ? weatherService.getWeather(savedLocation.lat, savedLocation.lon, false, { name: savedLocation.name })
      : weatherService.getWeatherForCity(city);

    const [weatherData, alertsData] = await Promise.all([
      weatherPromise,
      AlertService.getActiveAlerts(city).catch(() => null)
    ]);
    data = weatherData;
    officialAlerts = alertsData;
  } catch (e: unknown) {
    if (e instanceof Error) {
      error = e.message;
    } else {
      error = "Failed to load weather data";
    }
  }

  if (error || !data) {
    return (
      <div className="flex flex-col h-full w-full">
        <DashboardLocationBar currentCity={city} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-sky-surface border border-sky-border rounded-2xl shadow-sm text-center max-w-md">
            <CloudOff className="h-12 w-12 text-sky-text-secondary opacity-50" />
            <p className="text-sky-danger text-lg font-semibold">Weather data unavailable</p>
            <p className="text-sky-text-secondary text-sm">
              {error}. We couldn&apos;t retrieve the latest data for <strong>{city}</strong>. 
              Please check your connection or try a different location.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Location bar + search */}
      <DashboardLocationBar currentCity={data.location.display_location || data.location.city} />

      {/* Stale data warning */}
      {data.freshness.stale && (
        <div className="mx-4 md:mx-6 mt-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-500">Displaying Cached Data</p>
            <p className="text-xs text-sky-text-secondary mt-0.5">
              The live weather API is unreachable. Data was last fetched at{' '}
              {new Date(data.freshness.fetched_at).toLocaleTimeString()} — it may be stale.
            </p>
          </div>
        </div>
      )}

      {/* Official Alert Warning Banner */}
      {officialAlerts?.status === 'ready' && officialAlerts.alerts.length > 0 && (
        <div className="mx-4 md:mx-6 mt-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-500">Active Official Weather Warnings</p>
              <p className="text-xs text-sky-text-secondary mt-0.5">
                {officialAlerts.alerts.length} official warning(s) issued for this location.
              </p>
            </div>
          </div>
          <Link 
            href={`/alerts?city=${encodeURIComponent(city)}`}
            className="text-xs font-bold px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors shrink-0"
          >
            View Details
          </Link>
        </div>
      )}

      {/* Main content */}
      <div className="w-full max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6 pb-24">
        <CurrentWeatherCard data={data} />
        
        <WeatherMetrics data={data} />

        <TemperatureRangeBar data={data} />
        
        <ForecastChart data={data} />
        
        <DailyForecast data={data} />
      </div>
    </div>
  );
}
