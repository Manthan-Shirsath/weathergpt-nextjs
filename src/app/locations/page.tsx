import type { Metadata } from 'next';
import { LocationsClientPage } from '@/components/location/LocationsClientPage';

export const metadata: Metadata = {
  title: 'Search Locations | SkyCast',
  description: 'Search any city or location to get instant weather intelligence from SkyCast.',
};

export default function LocationsPage() {
  return <LocationsClientPage />;
}
