"use client";

import React from 'react';
import type { CanonicalWeatherDataset } from '@/lib/weather/schema';
import { AlertTriangle, Thermometer, CloudRain, Wind, CloudOff, Info, Zap, ShieldAlert, CheckCircle, Clock, ChevronDown, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveAlertsResponse } from '@/lib/alerts/schema';

interface RiskItem {
  id: string;
  label: string;
  severity: 'high' | 'medium' | 'low' | 'none';
  icon: React.ComponentType<{ className?: string }>;
  detail: string;
  actions: string[];
  peakInfo?: string;
}

const RISK_ACTIONS: Record<string, string[]> = {
  heatwave: [
    'Avoid going out between 11:00 AM and 4:00 PM',
    'Drink at least 3–4 litres of water throughout the day',
    'Wear loose, light-colored, breathable cotton clothing',
    'Never leave children, elderly, or pets inside parked vehicles'
  ],
  heat: [
    'Take breaks in shaded or air-conditioned areas every 30 minutes',
    'Stay hydrated — drink oral rehydration fluids or water frequently',
    'Avoid strenuous outdoor activities during peak afternoon hours'
  ],
  rain: [
    'Carry an umbrella or waterproof raincoat if going outside',
    'Avoid low-lying or flood-prone roads and underpasses',
    'Check home drainage and secure power connections in damp areas'
  ],
  wind: [
    'Secure loose outdoor objects, balcony furniture, and signage',
    'Avoid parking or standing under old trees, hoardings, or power lines',
    'Drive cautiously and keep a firm grip on two-wheeler handles'
  ],
  storm: [
    'Stay indoors inside a sturdy building until the storm passes',
    'Unplug sensitive electrical equipment and avoid using corded devices',
    'Stay away from windows, tin roofs, and open fields during lightning'
  ],
};

function formatHour(timeStr: string | number): string {
  try {
    if (typeof timeStr === 'number') {
      const h = timeStr % 24;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedH = h % 12 || 12;
      return `${formattedH}:00 ${ampm}`;
    }
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
    }
    return String(timeStr);
  } catch {
    return String(timeStr);
  }
}

function assessRisks(data: CanonicalWeatherDataset): RiskItem[] {
  const { current, hourly } = data;
  const risks: RiskItem[] = [];
  const next24 = (hourly || []).slice(0, 24);

  // Peak heat search
  let maxTempHour = next24[0];
  if (next24.length > 0) {
    maxTempHour = next24.reduce((prev, curr) => (curr.temperature_c > prev.temperature_c ? curr : prev), next24[0]);
  }

  // Peak rain search
  let maxRainHour = next24[0];
  if (next24.length > 0) {
    maxRainHour = next24.reduce((prev, curr) => (curr.precipitation_probability > prev.precipitation_probability ? curr : prev), next24[0]);
  }

  // Peak wind search
  let maxWindHour = next24[0];
  if (next24.length > 0) {
    maxWindHour = next24.reduce((prev, curr) => (curr.wind_speed_kmh > prev.wind_speed_kmh ? curr : prev), next24[0]);
  }

  // Heatwave threshold
  if (current.temperature_c >= 40 || (maxTempHour && maxTempHour.temperature_c >= 40)) {
    const peakStr = maxTempHour ? `Peak heat: ${Math.round(maxTempHour.temperature_c)}°C at ${formatHour(maxTempHour.time || maxTempHour.hour)}` : undefined;
    risks.push({
      id: 'heatwave',
      label: 'Heatwave Risk',
      severity: 'high',
      icon: Thermometer,
      detail: `Temperature reaching ${Math.round(Math.max(current.temperature_c, maxTempHour?.temperature_c || current.temperature_c))}°C (threshold: ≥40°C). Limit outdoor exposure and stay hydrated.`,
      actions: RISK_ACTIONS.heatwave,
      peakInfo: peakStr,
    });
  } else if (current.temperature_c >= 35 || (maxTempHour && maxTempHour.temperature_c >= 35)) {
    const peakStr = maxTempHour ? `Peak heat: ${Math.round(maxTempHour.temperature_c)}°C at ${formatHour(maxTempHour.time || maxTempHour.hour)}` : undefined;
    risks.push({
      id: 'heat',
      label: 'Elevated Heat',
      severity: 'medium',
      icon: Thermometer,
      detail: `Temperature reaching ${Math.round(Math.max(current.temperature_c, maxTempHour?.temperature_c || current.temperature_c))}°C. Moderate heat — take breaks in shade.`,
      actions: RISK_ACTIONS.heat,
      peakInfo: peakStr,
    });
  }

  // High precipitation
  if (current.precipitation_probability >= 70 || (maxRainHour && maxRainHour.precipitation_probability >= 70)) {
    const peakProb = Math.max(current.precipitation_probability, maxRainHour?.precipitation_probability || 0);
    const peakStr = maxRainHour ? `Heaviest rain expected at ${formatHour(maxRainHour.time || maxRainHour.hour)} (${maxRainHour.precipitation_probability}% probability)` : undefined;
    risks.push({
      id: 'rain',
      label: 'Heavy Rain Risk',
      severity: peakProb >= 90 ? 'high' : 'medium',
      icon: CloudRain,
      detail: `${peakProb}% precipitation probability. Flooding possible in low-lying or poorly drained areas.`,
      actions: RISK_ACTIONS.rain,
      peakInfo: peakStr,
    });
  }

  // High wind
  if (current.wind_speed_kmh >= 60 || (maxWindHour && maxWindHour.wind_speed_kmh >= 60)) {
    const maxWind = Math.max(current.wind_speed_kmh, maxWindHour?.wind_speed_kmh || 0);
    const peakStr = maxWindHour ? `Peak wind: ${Math.round(maxWindHour.wind_speed_kmh)} km/h at ${formatHour(maxWindHour.time || maxWindHour.hour)}` : undefined;
    risks.push({
      id: 'wind',
      label: 'High Wind Alert',
      severity: maxWind >= 90 ? 'high' : 'medium',
      icon: Wind,
      detail: `Wind speeds reaching ${Math.round(maxWind)} km/h. High potential for falling branches and hazardous driving.`,
      actions: RISK_ACTIONS.wind,
      peakInfo: peakStr,
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
      actions: RISK_ACTIONS.storm,
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
    badge: 'bg-red-500/20 text-red-500 dark:text-red-400',
  },
  medium: {
    label: 'Medium Risk',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: 'text-amber-500',
    badge: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
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
    badge: 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400',
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
          <p className="text-sm font-bold text-sky-text-primary mb-1">WeatherGPT Computed Risks (Heuristic)</p>
          <p className="text-xs text-sky-text-secondary leading-relaxed">
            The risk assessments below are heuristic approximations derived from current and hourly weather thresholds
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
              <div key={alert.externalId} className="p-5 rounded-2xl border bg-red-500/10 border-red-500/30 shadow-sm">
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
        WeatherGPT Computed Risks
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
                className={cn('p-5 rounded-2xl border transition-all duration-300 shadow-sm', config.bg, config.border)}
              >
                <div className="flex items-start gap-4">
                  <div className={cn('p-2.5 rounded-xl', config.bg)}>
                    <Icon className={cn('h-5 w-5', config.icon)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <h3 className="font-bold text-sky-text-primary text-base">{risk.label}</h3>
                      <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide', config.badge)}>
                        {config.label}
                      </span>
                    </div>
                    
                    <p className="text-sm text-sky-text-secondary leading-relaxed mb-3">{risk.detail}</p>
                    
                    {/* Peak Timing Badge */}
                    {risk.peakInfo && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-surface-elevated/80 border border-sky-border text-xs font-semibold text-sky-text-primary mb-3">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                        <span>{risk.peakInfo}</span>
                      </div>
                    )}

                    {/* Actionable Steps Dropdown */}
                    {risk.actions && risk.actions.length > 0 && (
                      <details className="group/details mt-1 bg-sky-surface/60 border border-sky-border/80 rounded-xl overflow-hidden">
                        <summary className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-sky-text-primary cursor-pointer hover:bg-sky-surface select-none">
                          <span className="flex items-center gap-1.5 text-sky-primary font-bold">
                            <CheckCheck className="h-3.5 w-3.5" /> Recommended Actions ({risk.actions.length})
                          </span>
                          <ChevronDown className="h-4 w-4 text-sky-text-secondary group-open/details:rotate-180 transition-transform" />
                        </summary>
                        <ul className="px-4 py-2.5 space-y-1.5 border-t border-sky-border/40 text-xs text-sky-text-secondary">
                          {risk.actions.map((act, aIdx) => (
                            <li key={aIdx} className="flex items-start gap-2">
                              <span className="text-sky-primary font-bold mt-0.5">•</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deferred alert engine notice */}
      <div className="mt-8 p-5 bg-sky-surface border border-sky-border rounded-2xl shadow-xs">
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
