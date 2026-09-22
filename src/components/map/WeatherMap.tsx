"use client";

import React, { useEffect, useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

interface WeatherMapProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
}

export function WeatherMap({ center = [78.9629, 20.5937], zoom = 4.5 }: WeatherMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      // Dynamic import to avoid SSR — maplibre-gl uses browser APIs
      const maplibregl = await import('maplibre-gl');
      if (!mounted || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
            },
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 19,
              paint: {
                'raster-brightness-min': 0,
                'raster-brightness-max': 0.5,
                'raster-saturation': -0.3,
                'raster-contrast': 0.1,
              },
            },
          ],
        },
        center: center,
        zoom: zoom,
      });

      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      mapRef.current = map;
    };

    initMap();

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // center/zoom intentionally stable (init only)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-100"
      aria-label="Interactive weather map"
      role="region"
    />
  );
}
