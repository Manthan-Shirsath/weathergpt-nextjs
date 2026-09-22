"use client";

import React from 'react';
import { type CanonicalWeatherDataset } from '@/lib/weather/schema';
import { Droplets, Wind, Gauge, Eye, Sun } from 'lucide-react';

interface WeatherMetricsProps {
  data: CanonicalWeatherDataset;
}

export function WeatherMetrics({ data }: WeatherMetricsProps) {
  const { current } = data;

  const metrics = [
    {
      label: 'Humidity',
      value: `${current.humidity_pct}%`,
      icon: Droplets,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Wind',
      value: `${Math.round(current.wind_speed_kmh)} km/h`,
      subValue: current.wind_direction_label,
      icon: Wind,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    {
      label: 'Pressure',
      value: `${current.pressure_hpa} hPa`,
      icon: Gauge,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      label: 'Visibility',
      value: `${current.visibility_km} km`,
      icon: Eye,
      color: 'text-slate-500',
      bgColor: 'bg-slate-500/10'
    },
    {
      label: 'UV Index',
      value: current.uv_index.toString(),
      icon: Sun,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <div key={idx} className="bg-sky-surface border border-sky-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <Icon className={`h-5 w-5 ${metric.color}`} />
              </div>
              <span className="text-sm font-medium text-sky-text-secondary">{metric.label}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-sky-text-primary tracking-tight">{metric.value}</span>
              {metric.subValue && (
                <span className="text-xs text-sky-text-secondary mt-0.5">{metric.subValue}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
