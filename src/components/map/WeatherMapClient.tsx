"use client";

import dynamic from 'next/dynamic';

// ssr: false is only allowed in Client Components
const WeatherMap = dynamic(
  () => import('./WeatherMap').then((m) => m.WeatherMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-sky-surface-elevated rounded-2xl">
        <div className="flex flex-col items-center gap-3 text-sky-text-secondary">
          <div className="h-10 w-10 border-2 border-sky-primary/30 border-t-sky-primary rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading map...</span>
        </div>
      </div>
    ),
  }
);

interface WeatherMapClientProps {
  center?: [number, number];
  zoom?: number;
}

export function WeatherMapClient({ center, zoom }: WeatherMapClientProps) {
  return <WeatherMap center={center} zoom={zoom} />;
}
