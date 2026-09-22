'use client';

import React, { useState } from 'react';
import { ForecastIntelligenceData } from '@/lib/weather/multi-model';
import { VariableSelector, WeatherVariable } from './components/VariableSelector';
import { ModelControlPanel, ModelId, PresetKey, MODEL_CONFIGS } from './components/ModelControlPanel';
import { InteractiveChart } from './components/InteractiveChart';
import { AiSynthesisBanner } from './components/AiSynthesisBanner';
import { ModelInfoCards } from './components/ModelInfoCards';
import { Sparkles, MapPin } from 'lucide-react';

interface ForecastIntelligenceClientProps {
  initialData: ForecastIntelligenceData;
}

export function ForecastIntelligenceClient({ initialData }: ForecastIntelligenceClientProps) {
  const [activeVariable, setActiveVariable] = useState<WeatherVariable>('temperature');
  const [activeModels, setActiveModels] = useState<Set<ModelId>>(
    new Set<ModelId>(['consensus', 'ecmwf', 'gfs', 'icon', 'aifs', 'weathernext'])
  );
  const [activePreset, setActivePreset] = useState<PresetKey | 'custom'>('all');
  const [showLines, setShowLines] = useState<boolean>(true);
  const [showSpreadBand, setShowSpreadBand] = useState<boolean>(true);
  const [showDivergenceShading, setShowDivergenceShading] = useState<boolean>(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  const handleSelectPreset = (preset: PresetKey) => {
    setActivePreset(preset);
    if (preset === 'all') {
      setActiveModels(new Set<ModelId>(['consensus', 'ecmwf', 'gfs', 'icon', 'aifs', 'weathernext']));
    } else if (preset === 'physics') {
      setActiveModels(new Set<ModelId>(['consensus', 'ecmwf', 'gfs', 'icon']));
    } else if (preset === 'ai') {
      setActiveModels(new Set<ModelId>(['consensus', 'aifs', 'weathernext']));
    } else if (preset === 'ecmwf_duo') {
      setActiveModels(new Set<ModelId>(['consensus', 'ecmwf', 'aifs']));
    }
  };

  const handleToggleModel = (id: ModelId) => {
    setActiveModels(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) {
          next.delete(id);
        }
      } else {
        next.add(id);
      }
      return next;
    });
    setActivePreset('custom');
  };

  const currentAnalysisText = initialData.aiAnalysisText[activeVariable];

  return (
    <div className="p-3.5 sm:p-5 lg:p-6 max-w-7xl mx-auto space-y-3.5 sm:space-y-4 lg:space-y-5">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="p-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-fi-text">
              Forecast Intelligence
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-fi-muted">
            <div className="flex items-center gap-1 text-fi-text font-medium">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{initialData.locationName}</span>
            </div>
            <span>&bull;</span>
            <span className="truncate">Multi-Model Consensus &amp; Divergence Analysis (7 Days)</span>
          </div>
        </div>

        {/* Variable Switcher */}
        <VariableSelector
          activeVariable={activeVariable}
          onChange={setActiveVariable}
        />
      </div>

      {/* Model Control Panel (Presets, Checkboxes, Focus, View Toggles, Daily Agreement Grid) */}
      <ModelControlPanel
        activeModels={activeModels}
        onToggleModel={handleToggleModel}
        onSelectPreset={handleSelectPreset}
        activePreset={activePreset}
        showLines={showLines}
        onToggleLines={setShowLines}
        showSpreadBand={showSpreadBand}
        onToggleSpreadBand={setShowSpreadBand}
        showDivergenceShading={showDivergenceShading}
        onToggleDivergenceShading={setShowDivergenceShading}
        dailyAgreements={initialData.dailyAgreements}
        selectedDayIndex={selectedDayIndex}
        onSelectDay={setSelectedDayIndex}
        overallMaxDisagreement={initialData.overallMaxDisagreement}
        activeVariable={activeVariable}
      />

      {/* AI Synthesis Banner */}
      <AiSynthesisBanner
        locationName={initialData.locationName}
        spreadLevel={initialData.spreadLevel}
        aiAnalysisText={currentAnalysisText}
        hourlyData={initialData.hourly}
        activeVariable={activeVariable}
      />

      {/* Main Interactive Multi-Spline Chart */}
      <InteractiveChart
        hourlyPoints={initialData.hourly}
        activeVariable={activeVariable}
        activeModels={activeModels}
        showLines={showLines}
        showSpreadBand={showSpreadBand}
        showDivergenceShading={showDivergenceShading}
        selectedDayIndex={selectedDayIndex}
      />

      {/* 5 Model Specification Cards */}
      <ModelInfoCards />
    </div>
  );
}
