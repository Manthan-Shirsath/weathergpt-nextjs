import type { Metadata } from 'next';
import { WeatherMapClient } from '@/components/map/WeatherMapClient';
import { Layers, CloudRain, Wind, Info } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Weather Map | SkyCast',
  description:
    'Interactive weather map with geographic positioning. Radar overlays require real-time data pipeline migration.',
};

export default function MapPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] w-full p-4 md:p-6 gap-4">
      {/* Map header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-sky-text-primary flex items-center gap-2">
            <Layers className="h-5 w-5 text-sky-primary" />
            Interactive Weather Map
          </h1>
          <p className="text-xs text-sky-text-secondary mt-0.5">
            Geographic positioning ready · Radar overlays pending migration
          </p>
        </div>

        {/* Deferred layer controls — clearly labeled as future */}
        <div className="flex items-center gap-2">
          <button
            disabled
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl bg-sky-surface border border-sky-border text-sky-text-secondary opacity-50 cursor-not-allowed"
            title="Radar overlays require real-time data pipeline migration"
          >
            <CloudRain className="h-3.5 w-3.5" />
            Radar
            <span className="ml-1 px-1.5 py-0.5 bg-sky-surface-elevated rounded-md text-[10px] font-bold">
              Soon
            </span>
          </button>
          <button
            disabled
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl bg-sky-surface border border-sky-border text-sky-text-secondary opacity-50 cursor-not-allowed"
            title="Wind layers require real-time data pipeline migration"
          >
            <Wind className="h-3.5 w-3.5" />
            Wind
            <span className="ml-1 px-1.5 py-0.5 bg-sky-surface-elevated rounded-md text-[10px] font-bold">
              Soon
            </span>
          </button>
        </div>
      </div>

      {/* Map container — Client Component handles ssr:false dynamic import */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-sky-border shadow-md relative">
        <WeatherMapClient center={[78.9629, 20.5937]} zoom={4.5} />
      </div>

      {/* Info footer */}
      <div className="flex items-start gap-2 p-4 bg-sky-surface border border-sky-border rounded-2xl shrink-0">
        <Info className="h-4 w-4 text-sky-primary shrink-0 mt-0.5" />
        <p className="text-xs text-sky-text-secondary leading-relaxed">
          <strong className="text-sky-text-primary">Map Layer Status:</strong> Base geographic tiles are
          operational. Real-time radar, precipitation, wind, and temperature overlays require the live data
          ingestion pipeline which has not yet been migrated. These overlay controls are disabled until that
          migration is complete. Fabricated radar imagery will not be displayed.
        </p>
      </div>
    </div>
  );
}
