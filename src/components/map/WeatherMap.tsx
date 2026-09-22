"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import 'maplibre-gl/dist/maplibre-gl.css';

interface WeatherMapProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
}

interface CityWeather {
  name: string;
  lat: number;
  lon: number;
  temp: number;
  feels_like: number;
  condition: string;
  humidity: number;
  wind_speed: number;
  icon: string;
}

export function WeatherMap({ center = [78.9629, 20.5937], zoom = 4.5 }: WeatherMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [cityData, setCityData] = useState<CityWeather[]>([]);

  // 1. Detect and observe theme changes
  useEffect(() => {
    const checkDark = () => document.documentElement.classList.contains('dark');
    setIsDark(checkDark());

    const observer = new MutationObserver(() => {
      setIsDark(checkDark());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // 2. Fetch major cities weather batch
  useEffect(() => {
    let active = true;
    fetch('/api/weather-batch')
      .then(res => res.json())
      .then(json => {
        if (active && json.success && Array.isArray(json.cities)) {
          setCityData(json.cities);
        }
      })
      .catch(err => console.error('Failed to load map batch weather:', err));

    return () => {
      active = false;
    };
  }, []);

  // 3. Initialize MapLibre
  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      const maplibregl = await import('maplibre-gl');
      if (!mounted || !containerRef.current) return;

      // Clean up prior map instance
      if (mapRef.current) {
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        mapRef.current.remove();
        mapRef.current = null;
      }

      const lightTiles = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      const darkTiles = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';

      const tileSource = isDark ? darkTiles : lightTiles;
      const attribution = isDark
        ? '© <a href="https://carto.com/">CARTO</a>, © <a href="https://openstreetmap.org">OpenStreetMap</a>'
        : '© <a href="https://openstreetmap.org">OpenStreetMap</a>';

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            tiles: {
              type: 'raster',
              tiles: [tileSource],
              tileSize: 256,
              attribution,
            },
          },
          layers: [
            {
              id: 'base-tiles',
              type: 'raster',
              source: 'tiles',
              minzoom: 0,
              maxzoom: 19,
              paint: isDark
                ? {
                    'raster-brightness-min': 0,
                    'raster-brightness-max': 0.9,
                    'raster-contrast': 0.1,
                  }
                : {
                    'raster-brightness-min': 0,
                    'raster-brightness-max': 0.95,
                    'raster-saturation': -0.1,
                  },
            },
          ],
        },
        center: center,
        zoom: zoom,
      });

      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      mapRef.current = map;

      // Add city markers once map loads
      map.on('load', () => {
        if (!mounted) return;
        renderMarkers(map, maplibregl);
      });
    };

    initMap();

    return () => {
      mounted = false;
      if (mapRef.current) {
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  // Re-render markers when cityData updates
  useEffect(() => {
    if (mapRef.current && cityData.length > 0) {
      import('maplibre-gl').then(maplibregl => {
        renderMarkers(mapRef.current, maplibregl);
      });
    }
  }, [cityData]);

  const renderMarkers = (map: any, maplibregl: any) => {
    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!cityData || cityData.length === 0) return;

    cityData.forEach(city => {
      const el = document.createElement('div');
      el.className = 'group relative cursor-pointer';

      // Weather marker pill
      el.innerHTML = `
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg border transition-all duration-200 transform group-hover:scale-110 ${
          isDark 
            ? 'bg-slate-900/90 border-slate-700 text-white hover:border-sky-400 hover:bg-slate-800' 
            : 'bg-white/95 border-slate-200 text-slate-900 hover:border-sky-500 hover:bg-white'
        }">
          <span class="w-2 h-2 rounded-full ${
            city.temp >= 35 ? 'bg-rose-500' : city.temp >= 25 ? 'bg-amber-400' : 'bg-sky-400'
          }"></span>
          <span class="text-xs font-bold">${city.name}</span>
          <span class="text-xs font-semibold px-1.5 py-0.2 rounded-md ${
            isDark ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-700'
          }">${city.temp}°</span>
        </div>
      `;

      // Popup
      const popupHtml = `
        <div class="p-2 text-xs min-w-35 font-sans">
          <div class="font-bold text-sm mb-0.5">${city.name}</div>
          <div class="text-slate-500 capitalize mb-2">${city.condition} · Feels like ${city.feels_like}°C</div>
          <div class="flex justify-between text-[11px] mb-2 text-slate-600">
            <span>💧 ${city.humidity}%</span>
            <span>💨 ${city.wind_speed} km/h</span>
          </div>
          <button id="view-${city.name}" class="w-full text-center py-1 px-2 rounded-md bg-sky-500 hover:bg-sky-600 text-white font-semibold transition-colors cursor-pointer">
            Open Dashboard →
          </button>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 12, closeButton: false })
        .setHTML(popupHtml);

      popup.on('open', () => {
        const btn = document.getElementById(`view-${city.name}`);
        if (btn) {
          btn.addEventListener('click', () => {
            router.push(`/?city=${encodeURIComponent(city.name)}`);
          });
        }
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([city.lon, city.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', () => {
        router.push(`/?city=${encodeURIComponent(city.name)}`);
      });

      markersRef.current.push(marker);
    });
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-100 relative"
      aria-label="Interactive weather map"
      role="region"
    />
  );
}
