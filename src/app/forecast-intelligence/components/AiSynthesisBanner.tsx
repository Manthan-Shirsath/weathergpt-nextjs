'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, Bot, Check } from 'lucide-react';
import { HourlyIntelligencePoint } from '@/lib/weather/multi-model';
import { WeatherVariable } from './VariableSelector';

interface AiSynthesisBannerProps {
  locationName: string;
  spreadLevel: 'Low Spread' | 'Moderate Spread' | 'High Divergence';
  aiAnalysisText: string;
  hourlyData: HourlyIntelligencePoint[];
  activeVariable: WeatherVariable;
}

export function AiSynthesisBanner({
  locationName,
  spreadLevel,
  aiAnalysisText,
  hourlyData,
  activeVariable
}: AiSynthesisBannerProps) {
  const [copied, setCopied] = useState(false);

  const handleExportCsv = () => {
    if (!hourlyData || hourlyData.length === 0) return;

    const headers = [
      'Time',
      'Day',
      'Hour',
      'ECMWF_IFS',
      'NOAA_GFS',
      'DWD_ICON',
      'ECMWF_AIFS',
      'Google_WeatherNext2',
      'Consensus',
      'Spread_Min',
      'Spread_Max',
      'Spread',
      'Is_Divergent'
    ];

    const rows = hourlyData.map(p => {
      const v = p[activeVariable];
      return [
        `"${p.time}"`,
        p.dayOfWeek,
        p.hour,
        v.ecmwf,
        v.gfs,
        v.icon,
        v.aifs,
        v.weathernext,
        v.consensus,
        v.spread_min,
        v.spread_max,
        v.spread,
        v.isDivergent ? 'YES' : 'NO'
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `weathergpt_forecast_intelligence_${locationName}_${activeVariable}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPng = () => {
    // Find the chart container svg and create an image or print
    const chartSvg = document.querySelector('.recharts-wrapper svg');
    if (!chartSvg) {
      alert('Chart element ready for capture');
      return;
    }
    
    // Quick copy confirmation feedback
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(chartSvg);
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.src = url;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = chartSvg.clientWidth || 1000;
      canvas.height = chartSvg.clientHeight || 450;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Dark background for canvas
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `weathergpt_${locationName}_${activeVariable}_chart.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      URL.revokeObjectURL(url);
    };
  };

  const badgeBg =
    spreadLevel === 'Low Spread'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : spreadLevel === 'Moderate Spread'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : 'bg-rose-500/20 text-rose-300 border-rose-500/30';

  const beaconColor =
    spreadLevel === 'Low Spread'
      ? 'bg-emerald-400'
      : spreadLevel === 'Moderate Spread'
      ? 'bg-amber-400'
      : 'bg-rose-400';

  return (
    <div className="p-4 bg-fi-surface border border-fi-border rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
      <div className="space-y-1.5 max-w-3xl">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-blue-400 uppercase tracking-wider">
            <Bot className="w-3.5 h-3.5 text-blue-400" />
            WeatherGPT AI Analysis:
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${badgeBg}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${beaconColor}`} />
            {spreadLevel}
          </span>
        </div>
        <p className="text-xs text-fi-muted leading-relaxed">
          {aiAnalysisText}
        </p>
      </div>

      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-fi-panel hover:bg-fi-surface text-fi-text border border-fi-border transition cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export CSV</span>
        </button>

        <button
          onClick={handleExportPng}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-fi-panel hover:bg-fi-surface text-fi-text border border-fi-border transition cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-blue-400" />}
          <span>{copied ? 'Exported PNG' : 'Export PNG'}</span>
        </button>
      </div>
    </div>
  );
}
