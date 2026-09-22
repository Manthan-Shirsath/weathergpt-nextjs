import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col h-full w-full animate-pulse">
      {/* Top Location Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 bg-sky-surface/40 backdrop-blur-xl border-b border-sky-border">
        <div className="flex items-center gap-2.5">
          <div className="h-5 w-5 rounded-full bg-sky-surface-elevated" />
          <div className="h-6 w-36 rounded-lg bg-sky-surface-elevated" />
          <div className="h-4 w-16 rounded-full bg-sky-surface-elevated/60" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 rounded-xl bg-sky-surface-elevated" />
          <div className="h-8 w-20 rounded-xl bg-sky-surface-elevated" />
          <div className="h-8 w-20 rounded-xl bg-sky-surface-elevated" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6 pb-24">
        {/* Current Weather Card Skeleton */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-surface/80 to-sky-surface-elevated/50 border border-sky-border p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3">
              <div className="h-4 w-32 rounded bg-sky-surface-elevated" />
              <div className="flex items-baseline gap-4">
                <div className="h-20 w-32 rounded-2xl bg-sky-surface-elevated" />
                <div className="space-y-1.5">
                  <div className="h-6 w-28 rounded bg-sky-surface-elevated" />
                  <div className="h-4 w-20 rounded bg-sky-surface-elevated/60" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-full bg-sky-surface-elevated/70" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-sky-border/40 flex flex-wrap gap-4">
            <div className="h-4 w-24 rounded bg-sky-surface-elevated" />
            <div className="h-4 w-28 rounded bg-sky-surface-elevated" />
            <div className="h-4 w-32 rounded bg-sky-surface-elevated" />
          </div>
        </div>

        {/* 4 Metric Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-sky-surface/60 border border-sky-border backdrop-blur-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 rounded bg-sky-surface-elevated" />
                <div className="h-7 w-7 rounded-xl bg-sky-surface-elevated" />
              </div>
              <div className="h-8 w-24 rounded bg-sky-surface-elevated" />
              <div className="h-3 w-16 rounded bg-sky-surface-elevated/60" />
            </div>
          ))}
        </div>

        {/* Hourly Forecast Chart Skeleton */}
        <div className="p-6 rounded-3xl bg-sky-surface/60 border border-sky-border backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 rounded bg-sky-surface-elevated" />
            <div className="h-6 w-24 rounded bg-sky-surface-elevated/60" />
          </div>
          <div className="h-48 w-full rounded-2xl bg-sky-surface-elevated/40 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sky-text-secondary text-sm">
              <div className="h-4 w-4 rounded-full border-2 border-sky-primary border-t-transparent animate-spin" />
              <span>Fetching live meteorological data...</span>
            </div>
          </div>
        </div>

        {/* Daily Forecast List Skeleton */}
        <div className="p-6 rounded-3xl bg-sky-surface/60 border border-sky-border backdrop-blur-md space-y-3">
          <div className="h-6 w-36 rounded bg-sky-surface-elevated mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-sky-border/40 last:border-0">
              <div className="h-4 w-24 rounded bg-sky-surface-elevated" />
              <div className="h-6 w-6 rounded-full bg-sky-surface-elevated" />
              <div className="h-4 w-32 rounded bg-sky-surface-elevated" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
