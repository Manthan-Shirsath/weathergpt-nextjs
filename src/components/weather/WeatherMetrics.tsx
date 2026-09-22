"use client";

import React from 'react';
import { type CanonicalWeatherDataset } from '@/lib/weather/schema';
import { Droplets, Wind, Gauge, Eye, Sun } from 'lucide-react';

interface WeatherMetricsProps {
  data: CanonicalWeatherDataset;
}

export function WeatherMetrics({ data }: WeatherMetricsProps) {
  const { current, hourly } = data;
  const targetHour = hourly && hourly.length > 3 ? hourly[3] : (hourly && hourly.length > 1 ? hourly[1] : undefined);

  const getTrend = (currentVal: number, futureVal?: number, unit: string = '') => {
    if (futureVal === undefined || isNaN(futureVal)) return null;
    const diff = futureVal - currentVal;
    if (Math.abs(diff) < 0.2) return { text: 'steady (3h)', isUp: null };
    const sign = diff > 0 ? '+' : '';
    const rounded = Math.round(diff * 10) / 10;
    return {
      text: `${sign}${rounded}${unit} in 3h`,
      isUp: diff > 0
    };
  };

  const metrics = [
    {
      label: 'Humidity',
      value: `${current.humidity_pct}%`,
      trend: getTrend(current.humidity_pct, targetHour?.humidity_pct, '%'),
      icon: Droplets,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Wind',
      value: `${Math.round(current.wind_speed_kmh)} km/h`,
      subValue: current.wind_direction_label,
      trend: getTrend(current.wind_speed_kmh, targetHour?.wind_speed_kmh, ' km/h'),
      icon: Wind,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    {
      label: 'Pressure',
      value: `${current.pressure_hpa} hPa`,
      trend: getTrend(current.pressure_hpa, targetHour?.pressure_hpa, ' hPa'),
      icon: Gauge,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      label: 'Visibility',
      value: `${current.visibility_km} km`,
      trend: null,
      icon: Eye,
      color: 'text-slate-500',
      bgColor: 'bg-slate-500/10'
    },
    {
      label: 'UV Index',
      value: current.uv_index.toString(),
      trend: getTrend(current.uv_index, targetHour?.uv_index),
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <span className="text-sm font-medium text-sky-text-secondary">{metric.label}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-xl font-bold text-sky-text-primary tracking-tight">{metric.value}</span>
                {metric.trend && (
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                    metric.trend.isUp === true 
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                      : metric.trend.isUp === false 
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' 
                        : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    {metric.trend.isUp === true ? '↑' : metric.trend.isUp === false ? '↓' : '→'} {metric.trend.text}
                  </span>
                )}
              </div>
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
