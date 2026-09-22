"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';

import { saveActiveLocation, getClientActiveLocation, SavedLocation } from '@/lib/location/store';

interface GeoResult {
  name: string;
  display: string;
  lat: number;
  lon: number;
}

interface LocationSearchProps {
  placeholder?: string;
  className?: string;
  /** Called when a location is selected. If not provided, navigates to `/?city=`. */
  onSelect?: (result: GeoResult) => void;
  autoFocus?: boolean;
}

async function geocode(query: string): Promise<GeoResult[]> {
  if (!query.trim() || query.length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (!data || typeof data !== 'object' || !('results' in data)) return [];
    const results = (data as { results: unknown }).results;
    if (!Array.isArray(results)) return [];
    return results
      .filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object')
      .map((r) => ({
        name: String(r.name ?? ''),
        display: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
        lat: Number(r.latitude),
        lon: Number(r.longitude),
      }))
      .filter((r) => r.name && !isNaN(r.lat) && !isNaN(r.lon));
  } catch {
    return [];
  }
}

export function LocationSearch({ placeholder = 'Search any city...', className, onSelect, autoFocus }: LocationSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with active location safely after mount to avoid hydration mismatch
  useEffect(() => {
    const timer = setTimeout(() => {
      const active = getClientActiveLocation();
      if (active?.display) {
        setQuery(active.display);
      }
    }, 0);

    const handleLocationChange = (e: Event) => {
      const customEvent = e as CustomEvent<SavedLocation>;
      if (customEvent.detail?.display) {
        setQuery(customEvent.detail.display);
      }
    };
    window.addEventListener('skycast_location_change', handleLocationChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('skycast_location_change', handleLocationChange);
    };
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await geocode(q);
      setResults(res);
      setOpen(res.length > 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleSelect = (result: GeoResult) => {
    setQuery(result.display);
    setOpen(false);
    saveActiveLocation({
      name: result.name,
      display: result.display,
      lat: result.lat,
      lon: result.lon,
    });
    if (onSelect) {
      onSelect(result);
    } else {
      router.push(`/?city=${encodeURIComponent(result.name)}`);
    }
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative flex items-center">
        {loading ? (
          <Loader2 className="absolute left-4 h-4 w-4 text-sky-primary animate-spin pointer-events-none" />
        ) : (
          <Search className="absolute left-4 h-4 w-4 text-sky-text-secondary pointer-events-none" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-sky-surface border border-sky-border rounded-2xl pl-11 pr-10 py-3 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-primary/40 transition-all shadow-sm"
          aria-label="Search weather location"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-3 text-sky-text-secondary hover:text-sky-text-primary transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-sky-surface border border-sky-border rounded-2xl shadow-lg overflow-hidden z-50">
          <ul role="listbox" className="py-1.5 max-h-64 overflow-y-auto">
            {results.map((r, idx) => (
              <li key={idx} role="option" aria-selected={false}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-sky-surface-elevated transition-colors text-left"
                  onClick={() => handleSelect(r)}
                >
                  <MapPin className="h-4 w-4 text-sky-primary shrink-0" />
                  <span className="text-sky-text-primary font-medium truncate">{r.display}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
