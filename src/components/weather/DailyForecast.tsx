"use client";

import React from 'react';
import { type CanonicalWeatherDataset } from '@/lib/weather/schema';
import { ThermometerSun, Wind, CloudRain, CalendarDays } from 'lucide-react';

interface DailyForecastProps {
  data: CanonicalWeatherDataset;
}

export function DailyForecast({ data }: DailyForecastProps) {
  const daily = data.daily;

  if (!daily || daily.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-sky-text-primary mb-4 flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-sky-primary" />
        7-Day Outlook
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
        {daily.slice(0, 7).map((day, i) => {
          const dateObj = new Date(day.date_iso);
          const dayName = i === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dateString = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          return (
            <div key={i} className="border border-sky-border bg-sky-surface rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-sky-text-primary">{dayName}</p>
                  <p className="text-xs text-sky-text-secondary">{dateString}</p>
                </div>
                {day.rain_probability_pct > 30 && (
                   <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-primary/10 text-sky-primary border border-sky-primary/20">
                     {day.rain_probability_pct}% Rain
                   </span>
                )}
              </div>
              
              <div className="flex items-center gap-3 my-4">
                <div className="bg-sky-background p-2 rounded-lg border border-sky-border">
                  <ThermometerSun className="h-6 w-6 text-sky-primary" />
                </div>
                <div>
                  <div className="text-2xl font-black text-sky-text-primary">{Math.round(day.high_c)}°</div>
                  <div className="text-sm font-medium text-sky-text-secondary">{Math.round(day.low_c)}°</div>
                </div>
              </div>

              <p className="text-sm font-medium text-sky-text-primary mb-3">
                {day.condition}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs text-sky-text-secondary border-t border-sky-border pt-3">
                 <div className="flex items-center gap-1">
                   <Wind className="h-3 w-3" />
                   {Math.round(day.wind_speed_max_kmh)} km/h
                 </div>
                 <div className="flex items-center gap-1">
                   <CloudRain className="h-3 w-3" />
                   {day.rain_probability_pct}%
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
