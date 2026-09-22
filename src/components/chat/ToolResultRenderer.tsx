"use client";

import React from 'react';
import type { ToolUIPart, DynamicToolUIPart } from 'ai';
import { CurrentWeatherCard } from '../weather/CurrentWeatherCard';
import type { CanonicalWeatherDataset } from '@/lib/weather/schema';
import { Loader2, MapPin, AlertTriangle, Leaf } from 'lucide-react';

interface ToolResultRendererProps {
  part: ToolUIPart | DynamicToolUIPart;
}

function getToolName(part: ToolUIPart | DynamicToolUIPart): string {
  if (part.type === 'dynamic-tool') {
    return part.toolName;
  }
  // ToolUIPart: type is `tool-${name}` e.g. "tool-get_current_weather"
  return part.type.replace(/^tool-/, '');
}

export function ToolResultRenderer({ part }: ToolResultRendererProps) {
  const toolName = getToolName(part);
  const state = part.state;

  // Still executing
  if (state === 'input-streaming' || state === 'input-available') {
    const label =
      toolName === 'get_current_weather'
        ? 'Fetching live weather data...'
        : toolName === 'get_forecast'
        ? 'Analyzing forecast models...'
        : toolName === 'search_location'
        ? 'Locating coordinates...'
        : toolName === 'get_agriculture_advice'
        ? 'Evaluating agricultural conditions...'
        : toolName === 'get_weather_risk'
        ? 'Assessing weather risks...'
        : 'Processing...';

    return (
      <div className="flex items-center gap-3 p-4 bg-sky-surface/50 border border-sky-border rounded-xl animate-pulse">
        <Loader2 className="h-5 w-5 text-sky-primary animate-spin" />
        <span className="text-sm font-medium text-sky-text-secondary">{label}</span>
      </div>
    );
  }

  // Error
  if (state === 'output-error') {
    const errorText = 'errorText' in part ? String(part.errorText ?? 'An error occurred') : 'An error occurred';
    return (
      <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <span className="text-sm font-medium text-red-500">{errorText}</span>
      </div>
    );
  }

  // Output available
  if (state === 'output-available') {
    const output = 'output' in part ? part.output : undefined;

    if (toolName === 'get_current_weather' || toolName === 'get_forecast') {
      if (output) {
        return (
          <div className="my-4 animate-fade-in max-w-200">
            <CurrentWeatherCard data={output as CanonicalWeatherDataset} />
          </div>
        );
      }
    }

    if (toolName === 'search_location') {
      if (output && typeof output === 'object') {
        const loc = output as Record<string, unknown>;
        return (
          <div className="my-2 p-3 bg-sky-surface border border-sky-border rounded-xl flex items-center gap-3">
            <MapPin className="h-4 w-4 text-sky-primary" />
            <span className="text-sm font-medium text-sky-text-primary">
              Found: {String(loc.display_location ?? loc.city ?? 'Unknown location')}
            </span>
          </div>
        );
      }
    }

    if (toolName === 'get_agriculture_advice') {
      if (output && typeof output === 'object') {
        const ag = output as Record<string, unknown>;
        const warnings = Array.isArray(ag.warnings) ? ag.warnings as string[] : [];
        return (
          <div className="my-4 p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="h-5 w-5 text-emerald-500" />
              <h3 className="font-bold text-emerald-500">Agricultural Assessment</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-sky-text-secondary">Suitability</p>
                <p className="font-semibold text-sky-text-primary capitalize">{String(ag.suitability ?? 'Unknown')}</p>
              </div>
              <div>
                <p className="text-xs text-sky-text-secondary">Soil Moisture Trend</p>
                <p className="font-semibold text-sky-text-primary">{String(ag.soil_moisture_trend ?? 'Unknown')}</p>
              </div>
            </div>
            {warnings.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-amber-500 font-semibold mb-1">Warnings</p>
                <ul className="text-sm text-sky-text-primary list-disc list-inside">
                  {warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>
        );
      }
    }

    if (toolName === 'get_weather_risk') {
      if (output && typeof output === 'object') {
        const risk = output as Record<string, unknown>;
        return (
          <div className="my-4 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-amber-500">Risk Assessment</h3>
            </div>
            <p className="text-sm text-sky-text-primary">{String(risk.summary ?? 'No summary available')}</p>
          </div>
        );
      }
    }

    // Generic fallback for unknown tools
    return (
      <div className="p-3 bg-sky-surface border border-sky-border rounded-xl text-xs font-mono text-sky-text-secondary overflow-x-auto">
        Tool executed: {toolName}
      </div>
    );
  }

  // Approval states (not used in this version, but handle gracefully)
  return null;
}
