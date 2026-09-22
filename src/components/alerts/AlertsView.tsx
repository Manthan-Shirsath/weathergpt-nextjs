"use client";

import React from 'react';
import type { CanonicalWeatherDataset } from '@/lib/weather/schema';
import { AlertTriangle, Thermometer, CloudRain, Wind, CloudOff, Info, Zap, ShieldAlert, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveAlertsResponse } from '@/lib/alerts/schema';

interface RiskItem {
  id: string;
  label: string;
  severity: 'high' | 'medium' | 'low' | 'none';
  icon: React.ComponentType<{ className?: string }>;
  detail: string;
}

function assessRisks(data: CanonicalWeatherDataset): RiskItem[] {
  const { current } = data;
  const risks: RiskItem[] = [];

  // Heatwave threshold
  if (current.temperature_c >= 40) {
    risks.push({
      id: 'heatwave',
      label: 'Heatwave Risk',
      severity: 'high',
      icon: Thermometer,
      detail: `Temperature ${Math.round(current.temperature_c)}°C (threshold: ≥40°C). Limit outdoor exposure. Stay hydrated.`,
    });
  } else if (current.temperature_c >= 35) {
    risks.push({
      id: 'heat',
      label: 'Elevated Heat',
      severity: 'medium',
      icon: Thermometer,
      detail: `Temperature ${Math.round(current.temperature_c)}°C. Moderate heat — take breaks in shade.`,
    });
  }

  // High precipitation
  if (current.precipitation_probability >= 70) {
    risks.push({
      id: 'rain',
      label: 'Heavy Rain Risk',
      severity: current.precipitation_probability >= 90 ? 'high' : 'medium',
      icon: CloudRain,
      detail: `${current.precipitation_probability}% precipitation probability. Current: ${current.precipitation_mm.toFixed(1)} mm. Flooding possible in low-lying areas.`,
    });
  }

  // High wind
  if (current.wind_speed_kmh >= 60) {
    risks.push({
      id: 'wind',
      label: 'High Wind Alert',
      severity: current.wind_speed_kmh >= 90 ? 'high' : 'medium',
      icon: Wind,
      detail: `Wind speed ${Math.round(current.wind_speed_kmh)} km/h, gusts ${Math.round(current.wind_gusts_kmh)} km/h. Secure outdoor items.`,
    });
  }

  // Thunderstorm code
  if (current.weather_code >= 95 && current.weather_code <= 99) {
    risks.push({
      id: 'storm',
      label: 'Thunderstorm',
      severity: 'high',
      icon: Zap,
      detail: 'Active thunderstorm conditions. Avoid open areas and tall structures.',
    });
  }

  return risks;
}

const severityConfig = {
  high: {
    label: 'High Risk',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: 'text-red-500',
    badge: 'bg-red-500/20 text-red-400',
  },
  medium: {
    label: 'Medium Risk',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: 'text-amber-500',
    badge: 'bg-amber-500/20 text-amber-400',
  },
  low: {
    label: 'Low Risk',
    bg: 'bg-sky-primary/10',
    border: 'border-sky-primary/30',
    icon: 'text-sky-primary',
    badge: 'bg-sky-primary/20 text-sky-primary',
  },
  none: {
    label: 'No Risk',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-500',
    badge: 'bg-emerald-500/20 text-emerald-400',
  },
};

interface AlertsViewProps {
  data: CanonicalWeatherDataset | null;
  officialAlerts?: ActiveAlertsResponse | null;
  city: string;
  error?: string;
}

export function AlertsView({ data, officialAlerts, city, error }: AlertsViewProps) {
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] p-8 text-center">
        <CloudOff className="h-12 w-12 text-sky-text-secondary opacity-50 mb-4" />
        <p className="text-sky-danger font-semibold mb-2">Unable to assess risks for {city}</p>
        <p className="text-sky-text-secondary text-sm">{error ?? 'No weather data available.'}</p>
      </div>
    );
  }

  const risks = assessRisks(data);

  return (
    <div className="min-h-[calc(100vh-5rem)] p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-sky-text-primary flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-amber-500/10 rounded-2xl">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          Weather Risk Assessment
        </h1>
        <p className="text-sky-text-secondary text-sm ml-14">
          For <strong className="text-sky-text-primary">{data.location.display_location}</strong>
          {' '}· {new Date(data.freshness.fetched_at).toLocaleString()}
          {data.freshness.stale && (
            <span className="ml-2 text-amber-500 font-semibold">· Stale cache</span>
          )}
        </p>
      </div>

      {/* Approximation banner — clearly labeled */}
      <div className="mb-6 p-4 bg-sky-surface-elevated border border-sky-border rounded-2xl flex items-start gap-3">
        <Info className="h-5 w-5 text-sky-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-sky-text-primary mb-1">SkyCast Computed Risks (Heuristic)</p>
          <p className="text-xs text-sky-text-secondary leading-relaxed">
            The risk assessments below are heuristic approximations derived from current weather thresholds
            (temperature ≥40°C → heatwave, precipitation ≥70% → flood risk, wind ≥60 km/h → high wind, etc.).
            They are <strong>not</strong> official IMD alerts or authoritative disaster warnings.
          </p>
        </div>
      </div>

      {/* Official Alerts Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-sky-text-primary mb-4 flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-red-500" />
          Official Warnings
        </h2>
        
        {officialAlerts?.status === 'ready' && officialAlerts.alerts.length > 0 ? (
          <div className="space-y-4">
            {officialAlerts.alerts.map((alert) => (
              <div key={alert.externalId} className="p-5 rounded-2xl border bg-red-500/10 border-red-500/30">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-red-500/20 text-red-500">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <h3 className="font-bold text-sky-text-primary uppercase">{alert.event}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-red-500/20 text-red-400">
                        {alert.severity}
                      </span>
                      <span className="text-xs text-sky-text-secondary">Source: {alert.source}</span>
                      {alert.locationMatchLevel && (
                        <span className="text-xs text-sky-text-secondary border border-sky-border px-2 rounded-full">
                          Match: {alert.locationMatchLevel}
                        </span>
                      )}
                    </div>
                    {alert.headline && <p className="text-sm font-bold text-sky-text-primary mb-1">{alert.headline}</p>}
                    <p className="text-sm text-sky-text-secondary leading-relaxed mb-2">{alert.description}</p>
                    {alert.instruction && (
                      <div className="mt-2 p-3 bg-sky-background/50 rounded-lg border border-sky-border text-sm">
                        <strong className="text-sky-text-primary">Instructions: </strong>
                        <span className="text-sky-text-secondary">{alert.instruction}</span>
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-xs text-sky-text-secondary">
                      {alert.effectiveAt && <span>Effective: {new Date(alert.effectiveAt).toLocaleString()}</span>}
                      {alert.expiresAt && <span>Expires: {new Date(alert.expiresAt).toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <p className="text-sm text-emerald-500 font-medium">No active official warnings from IMD for this location.</p>
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold text-sky-text-primary mb-4 flex items-center gap-2">
        <Thermometer className="h-6 w-6 text-amber-500" />
        SkyCast Computed Risks
      </h2>

      {/* Risk cards */}
      {risks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-10 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
          <div className="p-4 bg-emerald-500/20 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-emerald-500 mb-2">No Active Risks Detected</h2>
          <p className="text-sm text-sky-text-secondary max-w-sm">
            No active weather risks detected in {data.location.city}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {risks.map((risk) => {
            const config = severityConfig[risk.severity];
            const Icon = risk.icon;
            return (
              <div
                key={risk.id}
                className={cn('p-5 rounded-2xl border', config.bg, config.border)}
              >
                <div className="flex items-start gap-4">
                  <div className={cn('p-2.5 rounded-xl', config.bg)}>
                    <Icon className={cn('h-5 w-5', config.icon)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <h3 className="font-bold text-sky-text-primary">{risk.label}</h3>
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide', config.badge)}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-sky-text-secondary leading-relaxed">{risk.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deferred alert engine notice */}
      <div className="mt-8 p-5 bg-sky-surface border border-sky-border rounded-2xl">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-sky-ai shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-sky-text-primary mb-1">Advanced Alert Engine — Planned</p>
            <p className="text-xs text-sky-text-secondary leading-relaxed">
              A future phase will integrate multi-source official alerts: IMD bulletins, district-level warnings,
              Cyclone warnings, Flood Watch, and real-time monitoring with alert timelines and 
              historical alert pattern analysis. This is distinct from the current threshold heuristics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
