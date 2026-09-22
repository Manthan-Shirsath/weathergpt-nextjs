'use client';

import React from 'react';
import { Layers, Eye, Sparkles, Check, Filter } from 'lucide-react';
import { DayAgreementSummary } from '@/lib/weather/multi-model';
import { WeatherVariable } from './VariableSelector';

export type ModelId = 'consensus' | 'ecmwf' | 'gfs' | 'icon' | 'aifs' | 'weathernext';

export interface ModelOption {
  id: ModelId;
  name: string;
  category: 'Ensemble' | 'Physics NWP' | 'Machine Learning' | 'Generative AI';
  color: string;
  badge?: string;
  strokeDasharray?: string;
}

export const MODEL_CONFIGS: ModelOption[] = [
  {
    id: 'consensus',
    name: 'Blended Consensus',
    category: 'Ensemble',
    color: '#ffffff',
    strokeDasharray: '4 4'
  },
  {
    id: 'ecmwf',
    name: 'ECMWF IFS (0.25°)',
    category: 'Physics NWP',
    color: '#3b82f6',
    badge: 'Physics'
  },
  {
    id: 'gfs',
    name: 'NOAA GFS (0.25°)',
    category: 'Physics NWP',
    color: '#f59e0b',
    badge: 'Physics'
  },
  {
    id: 'icon',
    name: 'DWD ICON (Global)',
    category: 'Physics NWP',
    color: '#10b981',
    badge: 'Physics'
  },
  {
    id: 'aifs',
    name: 'ECMWF AIFS (ML)',
    category: 'Machine Learning',
    color: '#a855f7',
    badge: 'ML'
  },
  {
    id: 'weathernext',
    name: 'Google WeatherNext 2 (GenAI)',
    category: 'Generative AI',
    color: '#ef4444',
    badge: 'GenAI'
  }
];

export type PresetKey = 'all' | 'physics' | 'ai' | 'ecmwf_duo';

interface ModelControlPanelProps {
  activeModels: Set<ModelId>;
  onToggleModel: (id: ModelId) => void;
  onSelectPreset: (preset: PresetKey) => void;
  activePreset: PresetKey | 'custom';
  showLines: boolean;
  onToggleLines: (val: boolean) => void;
  showSpreadBand: boolean;
  onToggleSpreadBand: (val: boolean) => void;
  showDivergenceShading: boolean;
  onToggleDivergenceShading: (val: boolean) => void;
  // Daily Agreement & Filter
  dailyAgreements: DayAgreementSummary[];
  selectedDayIndex: number | null; // null = all days (0..6 = specific day)
  onSelectDay: (dayIdx: number | null) => void;
  overallMaxDisagreement: {
    temperature: number;
    precipitation: number;
    windSpeed: number;
  };
  activeVariable: WeatherVariable;
}

export function ModelControlPanel({
  activeModels,
  onToggleModel,
  onSelectPreset,
  activePreset,
  showLines,
  onToggleLines,
  showSpreadBand,
  onToggleSpreadBand,
  showDivergenceShading,
  onToggleDivergenceShading,
  dailyAgreements,
  selectedDayIndex,
  onSelectDay,
  overallMaxDisagreement,
  activeVariable
}: ModelControlPanelProps) {

  const handleFocusModel = (modelId: ModelId, e: React.MouseEvent) => {
    e.stopPropagation();
    // If only this model is active, reset to all
    if (activeModels.size === 1 && activeModels.has(modelId)) {
      onSelectPreset('all');
    } else {
      // Isolate this model
      MODEL_CONFIGS.forEach(m => {
        if (m.id === modelId && !activeModels.has(m.id)) {
          onToggleModel(m.id);
        } else if (m.id !== modelId && activeModels.has(m.id)) {
          onToggleModel(m.id);
        }
      });
    }
  };

  const getVariableUnit = () => {
    if (activeVariable === 'temperature') return '°C';
    if (activeVariable === 'precipitation') return 'mm';
    return 'km/h';
  };

  const getOverallSpreadValue = () => {
    if (activeVariable === 'temperature') return `${overallMaxDisagreement.temperature}°C`;
    if (activeVariable === 'precipitation') return `${overallMaxDisagreement.precipitation} mm`;
    return `${overallMaxDisagreement.windSpeed} km/h`;
  };

  return (
    <div className="space-y-4">
      {/* Top row: Presets + View Mode Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/70 border border-slate-800/80 rounded-2xl backdrop-blur-md">
        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Presets:
          </span>
          <button
            onClick={() => onSelectPreset('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activePreset === 'all'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
            }`}
          >
            All Models
          </button>
          <button
            onClick={() => onSelectPreset('physics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activePreset === 'physics'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
            }`}
          >
            Physics NWP
          </button>
          <button
            onClick={() => onSelectPreset('ai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activePreset === 'ai'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
            }`}
          >
            AI / ML Only
          </button>
          <button
            onClick={() => onSelectPreset('ecmwf_duo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activePreset === 'ecmwf_duo'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
            }`}
          >
            ECMWF Duo (Physics vs ML)
          </button>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showLines}
              onChange={(e) => onToggleLines(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
            />
            <span>Lines</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showSpreadBand}
              onChange={(e) => onToggleSpreadBand(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
            />
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              Spread Band
            </span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDivergenceShading}
              onChange={(e) => onToggleDivergenceShading(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400/80 animate-pulse" />
              Divergence Shading
            </span>
          </label>
        </div>
      </div>

      {/* Model Selection Pills with Focus Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 p-3.5 bg-slate-900/50 border border-slate-800/60 rounded-2xl">
        {MODEL_CONFIGS.map(model => {
          const isSelected = activeModels.has(model.id);
          const isOnlyOne = activeModels.size === 1 && isSelected;

          return (
            <div
              key={model.id}
              onClick={() => onToggleModel(model.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer select-none ${
                isSelected
                  ? 'bg-slate-800/90 border-slate-600 text-slate-100 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/70 text-slate-500 hover:border-slate-700 hover:text-slate-400'
              }`}
            >
              {/* Checkbox circle with model color */}
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                  isSelected ? 'scale-100' : 'opacity-40'
                }`}
                style={{
                  backgroundColor: isSelected ? model.color : 'transparent',
                  border: `2px solid ${model.color}`
                }}
              >
                {isSelected && (
                  model.id === 'consensus' ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  ) : (
                    <Check className="w-2.5 h-2.5 text-slate-950 stroke-3" />
                  )
                )}
              </div>

              <span className="tracking-tight">{model.name}</span>

              {/* Focus button */}
              <button
                type="button"
                onClick={(e) => handleFocusModel(model.id, e)}
                title={isOnlyOne ? "Restore all models" : `Focus only on ${model.name}`}
                className={`ml-1 px-1.5 py-0.5 rounded text-[10px] tracking-wide uppercase transition cursor-pointer ${
                  isOnlyOne
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-400/40'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-slate-700/60'
                }`}
              >
                <Eye className="w-2.5 h-2.5 inline mr-0.5" />
                {isOnlyOne ? 'Unfocus' : 'Focus'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Daily Agreement & Overall Disagreement Metric Ribbon */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        {/* Left Metric Card: Max Overall Disagreement */}
        <div className="lg:col-span-3 p-4 bg-linear-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-800/80 rounded-2xl flex flex-col justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Max Overall Disagreement
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold tracking-tight text-amber-400">
              {getOverallSpreadValue()}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Peak multi-model spread across 7-day forecast
            </p>
          </div>
          {selectedDayIndex !== null && (
            <button
              onClick={() => onSelectDay(null)}
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 cursor-pointer self-start"
            >
              <Filter className="w-3 h-3" /> Showing Day {selectedDayIndex + 1} &bull; Reset to All Days
            </button>
          )}
        </div>

        {/* Right Metric Cards: 7-Day Agreement Strip */}
        <div className="lg:col-span-9 p-4 bg-slate-900/70 border border-slate-800/80 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Daily Agreement (Click day to filter)
            </span>
            {selectedDayIndex !== null && (
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
                Filtered: {dailyAgreements[selectedDayIndex]?.formattedDate || `Day ${selectedDayIndex + 1}`}
              </span>
            )}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {dailyAgreements.map((day) => {
              const isFiltered = selectedDayIndex === day.dayIndex;
              const isToday = day.dayIndex === 0;

              // Traffic light dot colors
              const dotColor =
                day.rating === 'HIGH'
                  ? 'bg-emerald-400 shadow-emerald-400/50'
                  : day.rating === 'MODERATE'
                  ? 'bg-amber-400 shadow-amber-400/50'
                  : 'bg-rose-500 shadow-rose-500/50';

              const ratingTextColor =
                day.rating === 'HIGH'
                  ? 'text-emerald-400'
                  : day.rating === 'MODERATE'
                  ? 'text-amber-400'
                  : 'text-rose-400';

              const spreadVal =
                activeVariable === 'temperature'
                  ? `${day.maxSpreadTemp}°`
                  : activeVariable === 'precipitation'
                  ? `${day.maxSpreadPrecip}mm`
                  : `${day.maxSpreadWind}k`;

              return (
                <button
                  key={day.dayIndex}
                  onClick={() => onSelectDay(isFiltered ? null : day.dayIndex)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                    isFiltered
                      ? 'bg-blue-600/20 border-blue-500/60 ring-1 ring-blue-500/40 shadow-md'
                      : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-semibold text-slate-300">
                    {isToday ? 'Today' : day.dayOfWeek}
                  </div>

                  <div className="my-1 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full shadow-sm ${dotColor}`} />
                    <span className={`text-[10px] font-bold ${ratingTextColor}`}>
                      {day.rating === 'HIGH' ? 'High' : day.rating === 'MODERATE' ? 'Mod' : 'Low'}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    &Delta; {spreadVal}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
