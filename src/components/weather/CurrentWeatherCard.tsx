"use client";

import React, { useMemo } from 'react';
import { Sparkles, Droplets, Wind, Thermometer, Navigation } from 'lucide-react';
import { Button } from '@heroui/react';
import { WeatherBackground } from './WeatherBackground';
import { type CanonicalWeatherDataset } from '@/lib/weather/schema';
import { getTimeOfDay } from '@/lib/weather-visuals';

interface CurrentWeatherCardProps {
  data: CanonicalWeatherDataset;
  onOpenWeatherGPT?: () => void;
}

export function CurrentWeatherCard({ data, onOpenWeatherGPT }: CurrentWeatherCardProps) {
  const { location, current, hourly, daily } = data;

  const currentDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).format(new Date());
  }, []);

  const localTime = useMemo(() => {
    if (hourly && hourly.length > 0 && hourly[0].time) {
      const d = new Date(hourly[0].time);
      if (!isNaN(d.getTime())) {
        return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(d);
      }
    }
    return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date());
  }, [hourly]);

  const sun = useMemo(() => {
    return daily && daily.length > 0 ? { sunrise: daily[0].sunrise, sunset: daily[0].sunset } : undefined;
  }, [daily]);

  const timeOfDay = useMemo(() => {
    const localHour = hourly && hourly.length > 0 ? hourly[0].hour : undefined;
    return getTimeOfDay(localHour, sun?.sunrise, sun?.sunset);
  }, [hourly, sun]);

  const getOpenWeatherMapIconUrl = (iconStr: string) => {
    // If it's already a full URL or fallback
    if (iconStr.startsWith('http')) return iconStr;
    const mapped = {
      'sun': '01d', 'clear': '01d', 'partly-cloudy': '02d', 
      'cloudy': '03d', 'overcast': '04d', 'fog': '50d', 
      'rain': '10d', 'snow': '13d', 'thunderstorm': '11d'
    }[iconStr.toLowerCase()] || '02d';
    return `https://openweathermap.org/img/wn/${mapped}@2x.png`;
  };

  return (
    <section className="relative w-full h-130 rounded-[2.5rem] overflow-hidden shadow-lg border-0 isolate group transition-all duration-700">
      <WeatherBackground condition={current.condition} timeOfDay={timeOfDay} />
      
      <div className="absolute inset-0 z-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-90 mix-blend-multiply transition-opacity duration-1000" />
      <div className="absolute inset-0 z-0 bg-linear-to-r from-black/60 via-transparent to-black/30 opacity-70" />
      
      <div className="absolute inset-0 z-0 rounded-[2.5rem] border border-white/10 pointer-events-none" />
      
      <div className="relative z-10 p-8 md:p-14 h-full flex flex-col justify-between">
        
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center space-x-2 bg-black/20 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full w-max shadow-sm">
            <Navigation className="h-4 w-4 text-sky-400" />
            <span className="text-sm font-semibold tracking-wide text-white">
              {location.display_location || location.city}
            </span>
          </div>
          <p className="text-white/70 font-medium tracking-wide drop-shadow-md text-sm ml-2">
            {currentDate} &bull; {localTime}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-end gap-10">
          
          <div className="text-white w-full lg:w-auto flex flex-col drop-shadow-2xl">
            <div className="flex items-start">
              <h1 className="text-[6rem] sm:text-[9rem] md:text-[11rem] font-black tracking-tighter leading-none" style={{ textShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                {Math.round(current.temperature_c)}
              </h1>
              <span className="text-4xl sm:text-5xl md:text-7xl font-bold mt-2 sm:mt-4 ml-1 text-white/80">°</span>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 mb-6 sm:mb-8 mt-2 sm:-mt-2">
               <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-lg">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img 
                   src={getOpenWeatherMapIconUrl(current.icon)} 
                   alt={current.condition} 
                   className="h-10 w-10 sm:h-14 sm:w-14 object-contain filter drop-shadow-lg scale-110"
                 />
               </div>
               <span className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-glow line-clamp-1">
                 {current.condition}
               </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
              <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 hover:bg-black/40 transition-all hover:-translate-y-1 shadow-lg">
                <Droplets className="h-4 w-4 text-blue-400" />
                <span className="text-white/90">{current.humidity_pct}% Humidity</span>
              </div>
              <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 hover:bg-black/40 transition-all hover:-translate-y-1 shadow-lg">
                <Wind className="h-4 w-4 text-emerald-400" />
                <span className="text-white/90">{Math.round(current.wind_speed_kmh)} km/h Wind</span>
              </div>
              <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 hover:bg-black/40 transition-all hover:-translate-y-1 shadow-lg">
                <Thermometer className="h-4 w-4 text-orange-400" />
                <span className="text-white/90">Feels like {Math.round(current.feels_like_c)}°</span>
              </div>
            </div>
          </div>

          {onOpenWeatherGPT && (
            <div className="w-full lg:max-w-105 shrink-0 animate-float">
              <div className="relative group/card">
                <div className="absolute -inset-0.5 bg-linear-to-r from-sky-ai via-blue-500 to-sky-ai rounded-3xl blur opacity-30 group-hover/card:opacity-60 transition duration-1000 group-hover/card:duration-200 animate-pulse-slow"></div>
                
                <div className="relative bg-black/40 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-3xl p-7 hover:bg-black/50 transition-colors flex flex-col">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="bg-linear-to-br from-sky-ai to-blue-600 p-3 rounded-2xl shrink-0 shadow-glow">
                      <Sparkles className="h-6 w-6 text-white animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg tracking-tight mb-1">AI Insight</h3>
                      <p className="text-sm font-medium leading-relaxed text-white/80 line-clamp-3">
                        Ask WeatherGPT about the conditions in {location.city}...
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    onPress={onOpenWeatherGPT}
                    className="w-full justify-between font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl h-12 shadow-sm transition-all hover:scale-[1.02]"
                  >
                    Ask AI <span className="ml-2 group-hover/card:translate-x-1 transition-transform">&rarr;</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </section>
  );
}
