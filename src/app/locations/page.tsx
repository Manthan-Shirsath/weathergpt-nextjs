import type { Metadata } from 'next';
import { LocationsClientPage } from '@/components/location/LocationsClientPage';

export const metadata: Metadata = {
  title: 'Search Locations | WeatherGPT',
  description: 'Search any city or location to get instant weather intelligence from WeatherGPT.',
};

export default function LocationsPage() {
  return <LocationsClientPage />;
}
