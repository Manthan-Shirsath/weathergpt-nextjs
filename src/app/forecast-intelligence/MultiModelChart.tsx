"use client";

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { MultiModelData } from '@/lib/weather/multi-model';

export function MultiModelChart({ data }: { data: MultiModelData }) {
  // Format the data for Recharts
  const chartData = data.time.map((timeString, idx) => {
    const d = new Date(timeString);
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      gfs: data.gfs[idx] ?? undefined,
      ecmwf: data.ecmwf[idx] ?? undefined,
      icon: data.icon[idx] ?? undefined,
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
        <XAxis 
          dataKey="date" 
          tick={{ fill: '#94a3b8', fontSize: 12 }} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          tick={{ fill: '#94a3b8', fontSize: 12 }} 
          tickLine={false} 
          axisLine={false}
          domain={['auto', 'auto']}
          tickFormatter={(val) => `${val}°`}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', borderRadius: '12px' }}
          itemStyle={{ color: '#f1f5f9' }}
        />
        <Legend />
        <Line 
          type="monotone" 
          name="GFS"
          dataKey="gfs" 
          stroke="#0ea5e9" // sky-primary
          strokeWidth={3} 
          dot={{ r: 4, fill: '#0ea5e9' }} 
          activeDot={{ r: 6 }} 
          connectNulls
        />
        <Line 
          type="monotone" 
          name="ECMWF"
          dataKey="ecmwf" 
          stroke="#6366f1" // indigo-500
          strokeWidth={3} 
          dot={{ r: 4, fill: '#6366f1' }} 
          activeDot={{ r: 6 }} 
          connectNulls
        />
        <Line 
          type="monotone" 
          name="ICON"
          dataKey="icon" 
          stroke="#f59e0b" // amber-500
          strokeWidth={3} 
          dot={{ r: 4, fill: '#f59e0b' }} 
          activeDot={{ r: 6 }} 
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
