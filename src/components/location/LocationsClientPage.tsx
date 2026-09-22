"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LocationSearch } from './LocationSearch';
import { MapPin, Cloud, Navigation, Compass, ArrowRight } from 'lucide-react';
import { saveActiveLocation } from '@/lib/location/store';

const POPULAR_CITIES = [
  { name: 'Pune', country: 'India' },
  { name: 'Mumbai', country: 'India' },
  { name: 'Delhi', country: 'India' },
  { name: 'Nashik', country: 'India' },
  { name: 'Bengaluru', country: 'India' },
  { name: 'Chennai', country: 'India' },
  { name: 'Kolkata', country: 'India' },
  { name: 'Hyderabad', country: 'India' },
];

export function LocationsClientPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const navigateToCity = (city: string) => {
    setSelected(city);
    saveActiveLocation({
      name: city,
      display: `${city}, India`,
      lat: 0,
      lon: 0,
    });
    router.push(`/?city=${encodeURIComponent(city)}`);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-sky-primary/10 rounded-2xl">
            <Compass className="h-6 w-6 text-sky-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-sky-text-primary tracking-tight">
            Location Search
          </h1>
        </div>
        <p className="text-sky-text-secondary text-sm ml-14">
          Search any city or region for real-time weather intelligence.
          Persistent saved locations require authentication (planned for a future phase).
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <LocationSearch
          placeholder="Search any city or region..."
          className="w-full"
          autoFocus
          onSelect={(r) => navigateToCity(r.name)}
        />
      </div>

      {/* Popular cities */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-sky-text-secondary mb-4 flex items-center gap-2">
          <Navigation className="h-3.5 w-3.5" />
          Popular Locations
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {POPULAR_CITIES.map((city) => (
            <button
              key={city.name}
              onClick={() => navigateToCity(city.name)}
              className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 text-left hover:shadow-md ${
                selected === city.name
                  ? 'bg-sky-primary/10 border-sky-primary/50 text-sky-primary'
                  : 'bg-sky-surface border-sky-border hover:border-sky-primary/30 hover:bg-sky-surface-elevated'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-sky-primary shrink-0" />
                  <span className="text-sm font-semibold text-sky-text-primary">{city.name}</span>
                </div>
                <span className="text-xs text-sky-text-secondary ml-5">{city.country}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-sky-text-secondary group-hover:text-sky-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Deferred notice */}
      <div className="mt-10 p-5 bg-sky-surface border border-sky-border rounded-2xl">
        <div className="flex items-start gap-3">
          <Cloud className="h-5 w-5 text-sky-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-sky-text-primary mb-1">Cloud-Saved Locations</p>
            <p className="text-xs text-sky-text-secondary leading-relaxed">
              Saving favourite locations to your account, persistent favourites, and location-based push
              notifications require user authentication. This feature is planned for a future phase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
