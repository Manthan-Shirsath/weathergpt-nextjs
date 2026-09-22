'use client';

import React from 'react';
import { Cpu, Globe, Zap, Sparkles, Activity } from 'lucide-react';

interface ModelSpec {
  id: string;
  name: string;
  category: 'Physics NWP' | 'Machine Learning' | 'Generative AI';
  categoryColor: string;
  provider: string;
  resolution: string;
  cycle: string;
  icon: React.ReactNode;
  description: string;
  keyStrengths: string[];
}

const MODEL_SPECS: ModelSpec[] = [
  {
    id: 'ecmwf',
    name: 'ECMWF IFS (0.25°)',
    category: 'Physics NWP',
    categoryColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    provider: 'European Centre (ECMWF)',
    resolution: '0.25° (~25 km / 9 km native)',
    cycle: '4x daily (00, 06, 12, 18 UTC)',
    icon: <Globe className="w-4 h-4 text-blue-400" />,
    description: 'The global operational benchmark for numerical weather prediction, solving hydrostatic primitive equations with comprehensive data assimilation.',
    keyStrengths: ['Synoptic-scale accuracy', 'Upper-level jet dynamics', 'Mid-latitude storm tracking']
  },
  {
    id: 'aifs',
    name: 'ECMWF AIFS (ML)',
    category: 'Machine Learning',
    categoryColor: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
    provider: 'ECMWF AI Lab',
    resolution: '0.25° (~28 km)',
    cycle: '4x daily (00, 06, 12, 18 UTC)',
    icon: <Zap className="w-4 h-4 text-purple-400" />,
    description: 'ECMWF’s data-driven artificial intelligence forecasting system, trained on 40+ years of ERA5 reanalysis and operational analysis.',
    keyStrengths: ['Sub-second inference', 'Sharp thermal boundaries', 'Eliminates physics parameterization bias']
  },
  {
    id: 'weathernext',
    name: 'Google WeatherNext 2',
    category: 'Generative AI',
    categoryColor: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
    provider: 'Google DeepMind',
    resolution: '0.25° (64-member diffusion)',
    cycle: 'Continuous inference',
    icon: <Sparkles className="w-4 h-4 text-rose-400" />,
    description: 'Google DeepMind’s flagship generative diffusion model producing full atmospheric ensembles, outperforming physics ensembles in extreme weather probability.',
    keyStrengths: ['Extreme weather capturing', 'Probabilistic spread envelope', 'Zero spatial oversmoothing']
  },
  {
    id: 'gfs',
    name: 'NOAA GFS (0.25°)',
    category: 'Physics NWP',
    categoryColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    provider: 'NOAA / NCEP (USA)',
    resolution: '0.25° (~28 km / 13 km native)',
    cycle: '4x daily (00, 06, 12, 18 UTC)',
    icon: <Activity className="w-4 h-4 text-amber-400" />,
    description: 'The United States flagship global numerical weather prediction system featuring the Finite-Volume Cubed-Sphere (FV3) dynamical core.',
    keyStrengths: ['Rapid public updates', 'Tropical cyclone tracks', 'Deep convective precipitation']
  },
  {
    id: 'icon',
    name: 'DWD ICON (Global)',
    category: 'Physics NWP',
    categoryColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    provider: 'Deutscher Wetterdienst (DWD)',
    resolution: '~13 km icosahedral grid',
    cycle: '4x daily (00, 06, 12, 18 UTC)',
    icon: <Cpu className="w-4 h-4 text-emerald-400" />,
    description: 'German Weather Service icosahedral non-hydrostatic global model utilizing a triangular spherical grid for high-resolution orographic representation.',
    keyStrengths: ['Complex terrain flow', 'Non-hydrostatic dynamics', 'Boundary layer turbulence']
  }
];

export function ModelInfoCards() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold tracking-tight text-fi-text flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-400" />
          Forecasting Model Specifications
        </h3>
        <span className="text-xs text-fi-muted">
          5 Multi-Methodology Models &bull; Free Open-Meteo Integration
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {MODEL_SPECS.map(spec => (
          <div
            key={spec.id}
            className="p-4 bg-fi-panel border border-fi-border rounded-2xl flex flex-col justify-between hover:border-sky-primary/40 transition-all duration-200"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-sm text-fi-text">
                  {spec.icon}
                  <span>{spec.name}</span>
                </div>
              </div>

              <div className="mb-2.5">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${spec.categoryColor}`}>
                  {spec.category}
                </span>
              </div>

              <p className="text-[11px] text-fi-muted leading-relaxed mb-3">
                {spec.description}
              </p>
            </div>

            <div className="border-t border-fi-border pt-2.5 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-fi-muted">
                <span>Provider:</span>
                <span className="text-fi-text font-medium truncate max-w-30">{spec.provider}</span>
              </div>
              <div className="flex items-center justify-between text-fi-muted">
                <span>Resolution:</span>
                <span className="text-fi-text font-medium">{spec.resolution}</span>
              </div>
              <div className="flex items-center justify-between text-fi-muted">
                <span>Update:</span>
                <span className="text-fi-text font-medium">{spec.cycle}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
