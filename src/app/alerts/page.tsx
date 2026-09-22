import type { Metadata } from 'next';
import { weatherService } from '@/lib/weather/service';
import { AlertsView } from '@/components/alerts/AlertsView';
import { AlertService } from '@/lib/alerts/service';
import { ActiveAlertsResponse } from '@/lib/alerts/schema';

import { cookies } from 'next/headers';
import { parseLocationCookie } from '@/lib/location/store';

export const metadata: Metadata = {
  title: 'Weather Risk & Alerts | WeatherGPT',
  description: 'Threshold-based weather risk estimates and official active alerts for your location.',
};

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const savedLocation = parseLocationCookie(cookieStore.get('skycast_location')?.value);

  const city = typeof params.city === 'string' && params.city.trim() !== ''
    ? params.city.trim()
    : (savedLocation?.name || 'Pune');

  let data;
  let officialAlerts: ActiveAlertsResponse | null = null;
  let error: string | undefined;

  try {
    data = await weatherService.getWeatherForCity(city);
    officialAlerts = await AlertService.getActiveAlerts(city);
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : 'Failed to load data';
  }

  return <AlertsView data={data ?? null} officialAlerts={officialAlerts} city={city} error={error} />;
}
