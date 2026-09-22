"use client";

import React, { useMemo } from 'react';
import { type CanonicalWeatherDataset } from '@/lib/weather/schema';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ForecastChartProps {
  data: CanonicalWeatherDataset;
}

export function ForecastChart({ data }: ForecastChartProps) {
  const chartData = useMemo(() => {
    return data.hourly.slice(0, 24).map((h) => {
      const timeParts = h.time.split('T');
      const hourStr = timeParts.length > 1 ? timeParts[1].substring(0, 5) : h.time;
      return {
        time: hourStr,
        temp: h.temperature_c,
        rain: h.precipitation_mm
      };
    });
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 border border-sky-border bg-sky-surface shadow-sm rounded-2xl overflow-hidden">
        <div className="flex flex-col items-start px-6 pt-6 pb-2">
          <h3 className="text-lg font-bold text-sky-text-primary">24-Hour Temperature Trend</h3>
          <p className="text-sm text-sky-text-secondary">Expected temperature variations</p>
        </div>
        <div className="px-2 pb-6">
          <div className="h-62.5 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="time" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} 
                  dy={10}
                  minTickGap={30}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tickFormatter={(val) => `${Math.round(val)}°`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="temp" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="border border-sky-border bg-sky-surface shadow-sm rounded-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-lg font-bold text-sky-text-primary">Precipitation</h3>
        </div>
        <div className="px-2 pb-6">
          <div className="h-62.5 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="time" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} 
                  dy={10}
                  minTickGap={30}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  domain={[0, 'auto']}
                  tickFormatter={(val) => `${val}mm`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }}
                />
                <Bar dataKey="rain" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
