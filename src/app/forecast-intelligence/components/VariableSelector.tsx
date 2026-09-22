'use client';

import React from 'react';
import { Thermometer, CloudRain, Wind } from 'lucide-react';

export type WeatherVariable = 'temperature' | 'precipitation' | 'windSpeed';

interface VariableSelectorProps {
  activeVariable: WeatherVariable;
  onChange: (v: WeatherVariable) => void;
}

export function VariableSelector({ activeVariable, onChange }: VariableSelectorProps) {
  const options: { id: WeatherVariable; label: string; unit: string; icon: React.ReactNode }[] = [
    {
      id: 'temperature',
      label: 'TEMPERATURE',
      unit: '°C',
      icon: <Thermometer className="w-3.5 h-3.5" />
    },
    {
      id: 'precipitation',
      label: 'PRECIPITATION AMOUNT',
      unit: 'MM',
      icon: <CloudRain className="w-3.5 h-3.5" />
    },
    {
      id: 'windSpeed',
      label: 'WIND SPEED',
      unit: 'KM/H',
      icon: <Wind className="w-3.5 h-3.5" />
    }
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl border backdrop-blur-md transition-colors duration-300 bg-fi-surface border-fi-border shadow-xs">
      {options.map((opt) => {
        const isActive = activeVariable === opt.id;
        return (
          <button
            key={opt.id}
            id={`var-btn-${opt.id}`}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium tracking-wide transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-sky-primary text-white shadow-sm font-semibold'
                : 'text-fi-muted hover:text-fi-text hover:bg-fi-panel/60 border border-transparent'
            }`}
          >
            <span className={isActive ? 'text-white' : 'opacity-80'}>{opt.icon}</span>
            <span>{opt.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md transition-colors ${
                isActive
                  ? 'bg-black/20 text-white font-semibold'
                  : 'bg-fi-panel text-fi-muted border border-fi-border/50'
              }`}
            >
              ({opt.unit})
            </span>
          </button>
        );
      })}
    </div>
  );
}
