"use client";

import React from 'react';
import { Thermometer, CloudRain, Sparkles } from 'lucide-react';
import { type CanonicalWeatherDataset } from '@/lib/weather/schema';

interface TemperatureRangeBarProps {
  data: CanonicalWeatherDataset;
}

export function TemperatureRangeBar({ data }: TemperatureRangeBarProps) {
  const { current, daily } = data;
  if (!daily || daily.length === 0) return null;

  const today = daily[0];
  const low = today.low_c;
  const high = today.high_c;
  const curr = current.temperature_c;

  // Calculate percentage along the low-high range
  const span = Math.max(1, high - low);
  const positionPct = Math.min(100, Math.max(0, ((curr - low) / span) * 100));

  return (
    <div className="bg-sky-surface border border-sky-border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
            <Thermometer className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-sky-text-primary">Today&apos;s Temperature Range</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-sky-text-secondary">
          <span className="flex items-center gap-1">
            <CloudRain className="h-3.5 w-3.5 text-blue-400" />
            Rain Chance: <strong className="text-sky-text-primary">{today.rain_probability_pct ?? current.rain_probability_pct ?? 0}%</strong>
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Feels like: <strong className="text-sky-text-primary">{Math.round(current.feels_like_c)}°C</strong>
          </span>
        </div>
      </div>

      {/* Range bar with current position */}
      <div className="space-y-1.5 pt-1">
        <div className="relative w-full h-3 bg-sky-background border border-sky-border/60 rounded-full overflow-visible flex items-center">
          {/* Gradient filled bar */}
          <div className="absolute inset-0 rounded-full bg-linear-to-r from-blue-500 via-amber-400 to-rose-500 opacity-85" />
          
          {/* Current temperature marker dot */}
          <div
            className="absolute -top-1.5 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-500 z-10"
            style={{ left: `${positionPct}%` }}
          >
            <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-300 shadow-md flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping opacity-60" />
            </div>
          </div>
        </div>

        {/* Labels below the bar */}
        <div className="flex items-center justify-between text-xs font-semibold pt-1">
          <span className="text-blue-500">
            Low: {Math.round(low)}°C
          </span>
          <span className="text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full text-[11px]">
            Current: {Math.round(curr)}°C
          </span>
          <span className="text-rose-500">
            High: {Math.round(high)}°C
          </span>
        </div>
      </div>
    </div>
  );
}
