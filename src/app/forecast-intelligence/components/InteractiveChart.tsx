'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Brush
} from 'recharts';
import { HourlyIntelligencePoint } from '@/lib/weather/multi-model';
import { WeatherVariable } from './VariableSelector';
import { ModelId } from './ModelControlPanel';

interface InteractiveChartProps {
  hourlyPoints: HourlyIntelligencePoint[];
  activeVariable: WeatherVariable;
  activeModels: Set<ModelId>;
  showLines: boolean;
  showSpreadBand: boolean;
  showDivergenceShading: boolean;
  selectedDayIndex: number | null;
}

interface ChartDataPoint {
  index: number;
  time: string;
  formattedTime: string;
  dayOfWeek: string;
  hour: number;
  ecmwf: number;
  gfs: number;
  icon: number;
  aifs: number;
  weathernext: number;
  consensus: number;
  spread_min: number;
  spread_max: number;
  spread: number;
  spread_range: [number, number];
  divergence_range: [number, number] | null;
  isDivergent: boolean;
}

export function InteractiveChart({
  hourlyPoints,
  activeVariable,
  activeModels,
  showLines,
  showSpreadBand,
  showDivergenceShading,
  selectedDayIndex
}: InteractiveChartProps) {

  const chartData = useMemo(() => {
    const filtered = selectedDayIndex !== null
      ? hourlyPoints.filter(p => p.dayIndex === selectedDayIndex)
      : hourlyPoints;

    return filtered.map((p, idx): ChartDataPoint => {
      const v = p[activeVariable];
      return {
        index: idx,
        time: p.time,
        formattedTime: p.formattedTime,
        dayOfWeek: p.dayOfWeek,
        hour: p.hour,
        ecmwf: v.ecmwf,
        gfs: v.gfs,
        icon: v.icon,
        aifs: v.aifs,
        weathernext: v.weathernext,
        consensus: v.consensus,
        spread_min: v.spread_min,
        spread_max: v.spread_max,
        spread: v.spread,
        spread_range: [v.spread_min, v.spread_max],
        divergence_range: v.isDivergent ? [v.spread_min - 0.2, v.spread_max + 0.2] : null,
        isDivergent: v.isDivergent
      };
    });
  }, [hourlyPoints, activeVariable, selectedDayIndex]);

  const unit = activeVariable === 'temperature' ? '°C' : activeVariable === 'precipitation' ? 'mm' : 'km/h';

  // Custom Glassmorphic Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: ChartDataPoint = payload[0]?.payload;
    if (!data) return null;

    const items = [
      { id: 'consensus', label: 'Consensus', value: data.consensus, color: '#ffffff', active: activeModels.has('consensus') },
      { id: 'ecmwf', label: 'ECMWF IFS', value: data.ecmwf, color: '#3b82f6', active: activeModels.has('ecmwf') },
      { id: 'gfs', label: 'NOAA GFS', value: data.gfs, color: '#f59e0b', active: activeModels.has('gfs') },
      { id: 'icon', label: 'DWD ICON', value: data.icon, color: '#10b981', active: activeModels.has('icon') },
      { id: 'aifs', label: 'ECMWF AIFS (ML)', value: data.aifs, color: '#a855f7', active: activeModels.has('aifs') },
      { id: 'weathernext', label: 'WeatherNext 2 (GenAI)', value: data.weathernext, color: '#ef4444', active: activeModels.has('weathernext') }
    ].filter(item => item.active);

    return (
      <div className="bg-fi-panel border border-fi-border p-3.5 rounded-xl shadow-2xl text-xs space-y-2 min-w-50">
        <div className="flex items-center justify-between border-b border-fi-border pb-1.5">
          <span className="font-semibold text-fi-text">{data.formattedTime}</span>
          <span className="text-[10px] text-fi-muted font-mono">Hour {data.hour}:00</span>
        </div>

        <div className="space-y-1">
          {items.map(m => (
            <div key={m.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                <span className="text-fi-muted font-medium">{m.label}:</span>
              </div>
              <span className="font-mono font-bold text-fi-text">
                {m.value.toFixed(1)} {unit}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-fi-border flex items-center justify-between text-[11px]">
          <span className="text-fi-muted">Model Spread (&Delta;):</span>
          <span className={`font-mono font-bold ${data.isDivergent ? 'text-rose-400' : 'text-emerald-400'}`}>
            {data.spread.toFixed(1)} {unit}
          </span>
        </div>

        {data.isDivergent && (
          <div className="text-[10px] text-rose-500 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded font-medium text-center">
            &bull; High Model Divergence &bull;
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-fi-surface border border-fi-border rounded-xl p-3.5 sm:p-4.5 lg:p-5 shadow-lg">
      <div className="h-75 sm:h-88 md:h-100 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="spreadBandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#0284c7" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="divergenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#be123c" stopOpacity={0.15} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--fi-border)" vertical={false} />

            <XAxis
              dataKey="formattedTime"
              stroke="var(--fi-border)"
              tick={{ fill: 'var(--fi-muted)', fontSize: 11 }}
              tickLine={false}
              interval={selectedDayIndex !== null ? 2 : 11}
              tickMargin={10}
            />

            <YAxis
              stroke="var(--fi-border)"
              tick={{ fill: 'var(--fi-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              unit={` ${unit}`}
              domain={['auto', 'auto']}
              tickMargin={8}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Divergence Shading Area behind lines */}
            {showDivergenceShading && (
              <Area
                type="monotone"
                dataKey="divergence_range"
                fill="url(#divergenceGradient)"
                stroke="#f43f5e"
                strokeWidth={1}
                strokeDasharray="2 2"
                isAnimationActive={false}
                name="Divergence Envelope"
              />
            )}

            {/* Spread Band (Min/Max Envelope) */}
            {showSpreadBand && (
              <Area
                type="monotone"
                dataKey="spread_range"
                fill="url(#spreadBandGradient)"
                stroke="#0284c7"
                strokeWidth={0.8}
                strokeOpacity={0.5}
                isAnimationActive={false}
                name="Confidence Spread"
              />
            )}

            {/* Model Spline Curves */}
            {showLines && activeModels.has('ecmwf') && (
              <Line
                type="monotone"
                dataKey="ecmwf"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="ECMWF IFS (0.25°)"
              />
            )}

            {showLines && activeModels.has('gfs') && (
              <Line
                type="monotone"
                dataKey="gfs"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="NOAA GFS (0.25°)"
              />
            )}

            {showLines && activeModels.has('icon') && (
              <Line
                type="monotone"
                dataKey="icon"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="DWD ICON (Global)"
              />
            )}

            {showLines && activeModels.has('aifs') && (
              <Line
                type="monotone"
                dataKey="aifs"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                name="ECMWF AIFS (ML)"
              />
            )}

            {showLines && activeModels.has('weathernext') && (
              <Line
                type="monotone"
                dataKey="weathernext"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={false}
                name="Google WeatherNext 2 (GenAI)"
              />
            )}

            {/* Blended Consensus Line (Dashed White) */}
            {showLines && activeModels.has('consensus') && (
              <Line
                type="monotone"
                dataKey="consensus"
                stroke="#ffffff"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={false}
                name="Blended Consensus"
              />
            )}

            {/* Brush Timeline Slider */}
            <Brush
              dataKey="formattedTime"
              height={32}
              stroke="#3b82f6"
              fill="#0f172a"
              tickFormatter={(val) => val.split(' ')[0]}
              travellerWidth={12}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Chart Legend Pill Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs border-t border-fi-border/60 pt-2.5">
        {activeModels.has('consensus') && (
          <div className="flex items-center gap-1.5 text-slate-200">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-white inline-block" />
            <span className="font-semibold">Blended Consensus</span>
          </div>
        )}
        {activeModels.has('ecmwf') && (
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            <span>ECMWF IFS (0.25°)</span>
          </div>
        )}
        {activeModels.has('gfs') && (
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span>NOAA GFS (0.25°)</span>
          </div>
        )}
        {activeModels.has('icon') && (
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span>DWD ICON (Global)</span>
          </div>
        )}
        {activeModels.has('aifs') && (
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
            <span>ECMWF AIFS (ML)</span>
          </div>
        )}
        {activeModels.has('weathernext') && (
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span>Google WeatherNext 2 (GenAI)</span>
          </div>
        )}
        {showSpreadBand && (
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 rounded bg-cyan-500/30 border border-cyan-500/60 inline-block" />
            <span>Spread Band</span>
          </div>
        )}
        {showDivergenceShading && (
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/60 inline-block" />
            <span>Divergence Zone</span>
          </div>
        )}
      </div>
    </div>
  );
}
