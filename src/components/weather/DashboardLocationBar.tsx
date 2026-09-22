"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ChevronRight } from 'lucide-react';
import { LocationSearch } from '@/components/location/LocationSearch';
import { saveActiveLocation, getClientActiveLocation } from '@/lib/location/store';

interface DashboardLocationBarProps {
  currentCity: string;
}

export function DashboardLocationBar({ currentCity }: DashboardLocationBarProps) {
  useEffect(() => {
    if (!currentCity) return;
    const active = getClientActiveLocation();
    if (!active || active.name.toLowerCase() !== currentCity.toLowerCase()) {
      saveActiveLocation({
        name: currentCity,
        display: currentCity,
        lat: active?.name.toLowerCase() === currentCity.toLowerCase() ? active.lat : 0,
        lon: active?.name.toLowerCase() === currentCity.toLowerCase() ? active.lon : 0,
      });
    }
  }, [currentCity]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 sm:px-6 pt-4 pb-2">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-sky-text-secondary shrink-0">
        <Link href="/" className="hover:text-sky-text-primary transition-colors">Dashboard</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <div className="flex items-center gap-1.5 text-sky-text-primary font-medium">
          <MapPin className="h-3.5 w-3.5 text-sky-primary" />
          <span>{currentCity}</span>
        </div>
      </div>

      {/* Search — only visible on mobile (desktop uses header) */}
      <div className="w-full sm:max-w-xs lg:hidden">
        <LocationSearch placeholder="Search another city..." className="w-full" />
      </div>
    </div>
  );
}
