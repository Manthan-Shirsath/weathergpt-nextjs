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
      icon: <Thermometer className="w-4 h-4" />
    },
    {
      id: 'precipitation',
      label: 'PRECIPITATION AMOUNT',
      unit: 'MM',
      icon: <CloudRain className="w-4 h-4" />
    },
    {
      id: 'windSpeed',
      label: 'WIND SPEED',
      unit: 'KM/H',
      icon: <Wind className="w-4 h-4" />
    }
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
      {options.map(opt => {
        const isActive = activeVariable === opt.id;
        return (
          <button
            key={opt.id}
            id={`var-btn-${opt.id}`}
            onClick={() => onChange(opt.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs tracking-wider transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-500/25 border border-blue-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <span className={isActive ? 'text-white' : 'text-slate-400'}>{opt.icon}</span>
            <span>{opt.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
              isActive ? 'bg-blue-700/80 text-blue-100 font-semibold' : 'bg-slate-800 text-slate-400'
            }`}>
              ({opt.unit})
            </span>
          </button>
        );
      })}
    </div>
  );
}
